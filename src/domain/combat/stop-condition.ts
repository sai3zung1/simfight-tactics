/**
 * StopCondition — user-defined end criterion of a simulation run.
 *
 * Three modes acted in PROJECT_CONTEXT §4. The 60-second hard cap on
 * `time_to_kill` lives inside the engine and is not surfaced in this
 * input shape.
 *
 * `durationSeconds` is required by the type: a default value is applied
 * at the UI boundary before a StopCondition is built, so the domain
 * never sees a partially-specified value.
 */

export type StopCondition =
  | { readonly mode: "time_to_kill" }
  | { readonly mode: "fixed_duration"; readonly durationSeconds: number }
  | { readonly mode: "first_event"; readonly durationSeconds: number };
