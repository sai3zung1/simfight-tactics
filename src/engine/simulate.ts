import type { CombatConfig } from "../domain/combat/combat-config";
import type { StopCondition } from "../domain/combat/stop-condition";
import type {
  SimulationResult,
  StopReason,
} from "../domain/combat/simulation-result";
import type { CombatEvent } from "./combat-event";
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
 */
export function runLoop(
  queue: EventQueue,
  timeLimit: Ticks,
  process: (event: CombatEvent) => void,
): void {
  for (
    let e = queue.popNext();
    e !== undefined && e.time <= timeLimit;
    e = queue.popNext()
  ) {
    process(e);
  }
}

/** Map the user's stop mode to the run's time limit and reported reason. */
function resolveStop(stop: StopCondition): {
  timeLimit: Ticks;
  stopReason: StopReason;
} {
  switch (stop.mode) {
    case "time_to_kill":
      return {
        timeLimit: secondsToTicks(HARD_CAP_SECONDS),
        stopReason: "timeout",
      };
    case "fixed_duration":
      return {
        timeLimit: secondsToTicks(stop.durationSeconds),
        stopReason: "timer",
      };
    case "first_trigger":
      return {
        timeLimit: secondsToTicks(stop.durationSeconds),
        stopReason: "timer",
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
 * #46 has no event producers yet: the queue stays empty and the result carries
 * zero damage — only the duration and stop reason are exercised.
 */
export function simulate(config: CombatConfig): SimulationResult {
  const { timeLimit, stopReason } = resolveStop(config.stopCondition);

  const queue = createEventQueue();
  runLoop(queue, timeLimit, () => {});

  return {
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    effectiveDurationSeconds: ticksToSeconds(timeLimit),
    stopReason,
  };
}
