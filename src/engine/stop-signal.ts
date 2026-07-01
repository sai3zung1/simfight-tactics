import type { Ticks } from "./time";

/**
 * Tells `runLoop` to stop pulling further events right now. Carries only the
 * tick it happened at — `reason` and which combatant died are deferred until
 * bilateral combat needs to tell causes apart (parking-lot Roadmap); today
 * `process` only ever produces this on a kill.
 */
export type StopSignal = {
  readonly time: Ticks;
};
