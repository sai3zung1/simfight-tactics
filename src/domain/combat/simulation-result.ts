export type StopReason = "kill" | "timer" | "timeout";

export type SimulationResult = {
  readonly totalDamageDealt: number;
  readonly totalDamageTaken: number;
  readonly attackerCasts: number;
  readonly targetCasts: number;
  readonly effectiveDurationSeconds: number;
  readonly stopReason: StopReason;
};
