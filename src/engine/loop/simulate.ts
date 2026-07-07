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
import { createEventQueue, type EventQueue } from "./event-queue";
import { secondsToTicks, ticksToSeconds, type Ticks } from "./time";

/** Hard safety cap for `time_to_kill`: a build that cannot kill still terminates. */
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
 * whether a kill is allowed to end the run early. Only `fixed_duration`
 * treats the target as immortal (`lethal: false`) — the other two modes
 * exist precisely to end on a kill.
 */
function resolveStop(stop: StopCondition): {
  timeLimit: Ticks;
  stopReason: StopReason;
  lethal: boolean;
} {
  switch (stop.mode) {
    case "time_to_kill":
      return {
        timeLimit: secondsToTicks(HARD_CAP_SECONDS),
        stopReason: "timeout",
        lethal: true,
      };
    case "fixed_duration":
      return {
        timeLimit: secondsToTicks(stop.durationSeconds),
        stopReason: "timer",
        lethal: false,
      };
    case "first_trigger":
      return {
        timeLimit: secondsToTicks(stop.durationSeconds),
        stopReason: "timer",
        lethal: true,
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
 * until the real catalogs land. The run is still unidirectional: the target
 * never attacks, so `totalDamageTaken` stays 0.
 */
export function simulate(config: CombatConfig): SimulationResult {
  const { timeLimit, stopReason, lethal } = resolveStop(config.stopCondition);

  const attacker = resolveCombatant(
    resolveUnitStats(config.attacker.unitId),
    config.attacker.starLevel,
    "attacker" as CombatantId,
    resolveModifiers(config.attacker),
  );
  const target = resolveCombatant(
    resolveUnitStats(config.target.unitId),
    config.target.starLevel,
    "target" as CombatantId,
    resolveModifiers(config.target),
  );
  const state: CombatState = {
    attacker,
    target,
    totalDamageDealt: 0,
    attackerCasts: 0,
    targetCasts: 0,
  };

  const queue = createEventQueue();
  if (shouldAutoAttack(attacker)) {
    // The opening attack fires at combat start, not one interval in — a
    // provisional cadence choice, confirmed at calibration (#51).
    queue.push({
      kind: "auto-attack",
      time: 0 as Ticks,
      attacker: attacker.id,
      target: target.id,
    });
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

  const signal = runLoop(queue, timeLimit, createProcess(queue, state, lethal));

  return {
    totalDamageDealt: state.totalDamageDealt,
    totalDamageTaken: 0,
    attackerCasts: state.attackerCasts,
    targetCasts: state.targetCasts,
    effectiveDurationSeconds:
      signal !== undefined
        ? ticksToSeconds(signal.time)
        : ticksToSeconds(timeLimit),
    stopReason: signal !== undefined ? "kill" : stopReason,
  };
}
