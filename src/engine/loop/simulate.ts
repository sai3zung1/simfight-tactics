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
import { createEventQueue, type EventQueue } from "./event-queue";
import { TICK_ZERO, secondsToTicks, ticksToSeconds, type Ticks } from "./time";

/** Hard safety cap for `time-to-kill`: a build that cannot kill still terminates. */
const HARD_CAP_SECONDS = 60;

/**
 * Drive the queue in event order up to `timeLimit` — the latest tick the run is
 * allowed to reach. Events past it are not processed; an earlier event can still
 * end the run sooner.
 *
 * `process` is the seam that keeps the loop a pure scheduler: what an event
 * does to the combat state is injected, never known here.
 * If it returns a `StopSignal`, the loop stops pulling further events and
 * relays that signal upward unchanged — deciding why a run ends early is not
 * the loop's job, only honoring that decision is.
 */
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

/**
 * Map the user's stop mode to the run's time limit, reported reason, and
 * the target's mortality. Only `fixed-duration` pins the target immortal —
 * the other two modes exist precisely to end on a kill.
 */
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

/**
 * simulate — one deterministic combat run. The stop condition fixes how long the
 * run may last; the loop processes whatever events fall before that limit.
 *
 * Both sides resolve against a provisional profile picked via `unitId`
 * (`resolveUnitStats`) and provisional item modifiers (`resolveModifiers`)
 * until the real catalogs land. The duel is bidirectional — the target
 * fights back with the same mechanics; only the target can die.
 */
export function simulate(config: CombatConfig): SimulationResult {
  const { timeLimit, stopReason, targetCanDie } = resolveStop(
    config.stopCondition,
  );

  const attacker = resolveCombatant(
    resolveUnitStats(config.attacker.unitId),
    config.attacker.starLevel,
    "attacker" as CombatantId,
    resolveModifiers(config.attacker),
    // The attacker never dies — product rule: a run measures the attacker's
    // build, so only the target's death may end one.
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
  // Both openings fire at combat start, not one interval in — measured, and a
  // model commitment: no walk phase exists, combat starts at the first swing
  // (docs/data/calibration-log.md, C7). The push order is the same-tick
  // tie-break (the queue resolves ties by arrival): the attacker swings first,
  // an engine convention no live read can arbitrate (calibration log,
  // same-tick tie-break) — on every shared tick, including the killing one,
  // its hit resolves before the target's.
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
  // The first regen tick lands one interval in — nothing has accrued at
  // combat start. Both sides may tick: steady generation does not attack.
  for (const combatant of [attacker, target]) {
    if (shouldScheduleManaRegen(combatant)) {
      queue.push({
        kind: "mana-regen",
        time: secondsToTicks(MANA_REGEN_INTERVAL_SECONDS),
        combatant: combatant.id,
      });
    }
  }

  const signal = runLoop(queue, timeLimit, createProcess(queue, state));

  // The attacker-centric reading of the per-combatant tallies, produced
  // only here: in a 1v1, what the attacker takes is exactly what the
  // target dealt.
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
