import type { Ticks } from "./time";

/**
 * Tells `runLoop` to stop pulling further events right now. Carries only the
 * tick it happened at: the attacker can never die (`Combatant.canDie`), so
 * the only stop a process can produce is the target's death — which
 * combatant died, and why, need no encoding even with both sides fighting.
 */
export type StopSignal = {
  readonly time: Ticks;
};
