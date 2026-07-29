import type { CombatConfig } from "../../domain/combat/combat-config";
import type { StopCondition } from "../../domain/combat/stop-condition";
import type {
  SimulationResult,
  StopReason,
} from "../../domain/combat/simulation-result";
import type { CombatEvent } from "./combat-event";
import type { StopSignal } from "./stop-signal";
import type { CombatState } from "./combat-state";
import type { CombatantId } from "../stats/combatant-id";
import { shouldAutoAttack } from "../mechanics/auto-attack";
import {
  MANA_REGEN_INTERVAL_SECONDS,
  shouldScheduleManaRegen,
} from "../mechanics/casting";
import { createProcess } from "../mechanics/process-event";
import { resolveCombatant } from "../stats/combatant";
import { resolveModifiers } from "../provisional/provisional-modifiers";
import { resolveUnitStats } from "../provisional/provisional-stats";
import {
  resolveUnitSpellId,
  resolveUnitSpellParameters,
} from "../provisional/provisional-spell";
import { EMPTY_SPELL_REGISTRY, type SpellRegistry } from "../spell/contract";
import { createEventQueue, type EventQueue } from "./event-queue";
import { TICK_ZERO, secondsToTicks, ticksToSeconds, type Ticks } from "./time";

// Reached only when a time-to-kill run never kills — that mode carries no
// user timer. Hitting it reports "timeout", never a normal end.
const HARD_CAP_SECONDS = 60;

export function runLoop(
  queue: EventQueue,
  timeLimit: Ticks,
  process: (event: CombatEvent) => StopSignal | undefined,
): StopSignal | undefined {
  for (
    let e = queue.popNext();
    e !== undefined && e.time <= timeLimit;
    e = queue.popNext()
  ) {
    const signal = process(e);
    if (signal !== undefined) {
      return signal;
    }
  }
  return undefined;
}

function resolveStop(stop: StopCondition): {
  timeLimit: Ticks;
  stopReason: StopReason;
  targetCanDie: boolean;
} {
  switch (stop.mode) {
    case "time-to-kill":
      return {
        timeLimit: secondsToTicks(HARD_CAP_SECONDS),
        stopReason: "timeout",
        targetCanDie: true,
      };
    case "fixed-duration":
      // Immortal target, still fighting back: the mode measures damage over
      // the whole window, and a kill would cut that window short.
      return {
        timeLimit: secondsToTicks(stop.durationSeconds),
        stopReason: "timer",
        targetCanDie: false,
      };
    case "first-trigger":
      return {
        timeLimit: secondsToTicks(stop.durationSeconds),
        stopReason: "timer",
        targetCanDie: true,
      };
    default: {
      const _exhaustive: never = stop;
      return _exhaustive;
    }
  }
}

export function simulate(
  config: CombatConfig,
  registry: SpellRegistry = EMPTY_SPELL_REGISTRY,
): SimulationResult {
  const { timeLimit, stopReason, targetCanDie } = resolveStop(
    config.stopCondition,
  );

  const attacker = resolveCombatant(
    resolveUnitStats(config.attacker.unitId),
    config.attacker.starLevel,
    "attacker" as CombatantId,
    resolveModifiers(config.attacker),
    false,
    resolveUnitSpellId(config.attacker.unitId),
    resolveUnitSpellParameters(config.attacker.unitId),
  );
  const target = resolveCombatant(
    resolveUnitStats(config.target.unitId),
    config.target.starLevel,
    "target" as CombatantId,
    resolveModifiers(config.target),
    targetCanDie,
    resolveUnitSpellId(config.target.unitId),
    resolveUnitSpellParameters(config.target.unitId),
  );
  const state: CombatState = {
    attacker,
    target,
    damageDealtBy: { [attacker.id]: 0, [target.id]: 0 },
    castsBy: { [attacker.id]: 0, [target.id]: 0 },
  };

  const queue = createEventQueue();
  for (const [swinger, victim] of [
    [attacker, target],
    [target, attacker],
  ] as const) {
    if (shouldAutoAttack(swinger)) {
      queue.push({
        kind: "auto-attack",
        time: TICK_ZERO,
        attacker: swinger.id,
        target: victim.id,
      });
    }
  }
  for (const combatant of [attacker, target]) {
    if (shouldScheduleManaRegen(combatant)) {
      queue.push({
        kind: "mana-regen",
        time: secondsToTicks(MANA_REGEN_INTERVAL_SECONDS),
        combatant: combatant.id,
      });
    }
  }

  const signal = runLoop(
    queue,
    timeLimit,
    createProcess(queue, state, registry),
  );

  return {
    totalDamageDealt: state.damageDealtBy[attacker.id],
    totalDamageTaken: state.damageDealtBy[target.id],
    attackerCasts: state.castsBy[attacker.id],
    targetCasts: state.castsBy[target.id],
    effectiveDurationSeconds:
      signal !== undefined
        ? ticksToSeconds(signal.time)
        : ticksToSeconds(timeLimit),
    stopReason: signal !== undefined ? "kill" : stopReason,
  };
}
