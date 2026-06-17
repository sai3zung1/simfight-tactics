/**
 * Why a run ended — `kill` (target died), `timer` (user duration elapsed),
 * `timeout` (the engine's hard cap on `time_to_kill` was reached).
 */
export type StopReason = "kill" | "timer" | "timeout";

/**
 * SimulationResult — the measured outcome of one run; the engine's output
 * contract.
 *
 * Reports, it does not judge: raw measurements only. `dps` is intentionally
 * absent — it derives from `totalDamageDealt / effectiveDurationSeconds`, so
 * storing it would admit a result whose dps contradicts its own measurements.
 *
 * Time is reported in seconds (human-facing); the engine's internal tick unit
 * is converted at this boundary and never surfaced here.
 */
export type SimulationResult = {
  readonly totalDamageDealt: number;
  readonly totalDamageTaken: number;
  readonly effectiveDurationSeconds: number;
  readonly stopReason: StopReason;
};
