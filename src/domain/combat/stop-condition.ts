/**
 * StopCondition — user-chosen end criterion of a simulation run.
 *
 * Three modes, by intent:
 * - `time-to-kill`   — mortal target, no timer; ends on the target's death.
 *   The engine applies a hard safety cap for builds that cannot kill.
 * - `fixed-duration` — immortal target; runs the full user duration to
 *   measure total damage over a window.
 * - `first-trigger`  — mortal target; ends at the first of {death, timer}.
 *
 * The 60-second hard cap on `time-to-kill` lives inside the engine and is
 * not surfaced in this input shape.
 *
 * `durationSeconds` is required by the type: a default value is applied at
 * the UI boundary before a StopCondition is built, so the domain never sees
 * a partially-specified value.
 */

export type StopCondition =
  | { readonly mode: "time-to-kill" }
  | { readonly mode: "fixed-duration"; readonly durationSeconds: number }
  | { readonly mode: "first-trigger"; readonly durationSeconds: number };
