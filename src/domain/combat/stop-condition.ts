export type StopCondition =
  | { readonly mode: "time-to-kill" }
  | { readonly mode: "fixed-duration"; readonly durationSeconds: number }
  | { readonly mode: "first-trigger"; readonly durationSeconds: number };
