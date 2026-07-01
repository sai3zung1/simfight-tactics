import type { CombatConfig } from "../domain/combat/combat-config";
import type { StopCondition } from "../domain/combat/stop-condition";
import type {
  SimulationResult,
  StopReason,
} from "../domain/combat/simulation-result";
import type { CombatEvent } from "./combat-event";
import type { StopSignal } from "./stop-signal";
import type { CombatState } from "./combat-state";
import type { CombatantId } from "./combatant-id";
import { createProcess, shouldAutoAttack } from "./auto-attack";
import { resolveCombatant } from "./combatant";
import { resolveUnitStats } from "./provisional-stats";
import { createEventQueue, type EventQueue } from "./event-queue";
import { secondsToTicks, ticksToSeconds, type Ticks } from "./time";

/** Hard safety cap for `time_to_kill`: a build that cannot kill still terminates. */
const HARD_CAP_SECONDS = 60;

/**
 * Drive the queue in event order up to `timeLimit` — the latest tick the run is
 * allowed to reach. Events past it are not processed; an earlier event can still
 * end the run sooner.
 *
 * `process` is the seam: a no-op in this skeleton, damage resolution in #47.
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
 * (`resolveUnitStats`) until the real catalog lands. #47 is unidirectional:
 * the target never attacks, so `totalDamageTaken` stays 0.
 */
export function simulate(config: CombatConfig): SimulationResult {
  const { timeLimit, stopReason, lethal } = resolveStop(config.stopCondition);

  const attacker = resolveCombatant(
    resolveUnitStats(config.attacker.unitId),
    config.attacker.starLevel,
    "attacker" as CombatantId,
  );
  const target = resolveCombatant(
    resolveUnitStats(config.target.unitId),
    config.target.starLevel,
    "target" as CombatantId,
  );
  const state: CombatState = { attacker, target, totalDamageDealt: 0 };

  const queue = createEventQueue();
  if (shouldAutoAttack(attacker)) {
    queue.push({
      kind: "auto-attack",
      time: 0 as Ticks,
      attacker: attacker.id,
      target: target.id,
    });
  }

  const signal = runLoop(queue, timeLimit, createProcess(queue, state, lethal));

  return {
    totalDamageDealt: state.totalDamageDealt,
    totalDamageTaken: 0,
    effectiveDurationSeconds:
      signal !== undefined
        ? ticksToSeconds(signal.time)
        : ticksToSeconds(timeLimit),
    stopReason: signal !== undefined ? "kill" : stopReason,
  };
}
