/**
 * CombatConfig — full declarative input of one simulation run.
 *
 * Aggregates two symmetric BoardSides (PROJECT_CONTEXT §7) and the stop
 * condition. Pure declarative data: no runtime state, no engine internals.
 * The engine signature is `simulate(config: CombatConfig) => SimulationResult`.
 */

import type { BoardSide } from "./board-side";
import type { StopCondition } from "./stop-condition";

export type CombatConfig = {
  readonly attacker: BoardSide;
  readonly target: BoardSide;
  readonly stopCondition: StopCondition;
};
