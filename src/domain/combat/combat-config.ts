import type { BoardSide } from "./board-side";
import type { StopCondition } from "./stop-condition";

export type CombatConfig = {
  readonly attacker: BoardSide;
  readonly target: BoardSide;
  readonly stopCondition: StopCondition;
};
