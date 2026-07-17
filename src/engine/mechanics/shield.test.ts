import { test, expect } from "bun:test";
import { applyShield } from "./shield";
import { resolveCombatant, type Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import { PROVISIONAL_FIGHTER_STATS } from "../provisional/provisional-stats";
import { NEVER_EXPIRES } from "../loop/time";

const makeCombatant = (): Combatant =>
  resolveCombatant(
    PROVISIONAL_FIGHTER_STATS,
    1,
    "attacker" as CombatantId,
    [],
    false,
  );

test("applyShield pushes a fresh permanent-for-combat pool", () => {
  const c = makeCombatant();

  applyShield(c, 300);

  expect(c.shields).toEqual([{ remaining: 300, expiresAt: NEVER_EXPIRES }]);
});

test("shields are additive and independent: each application is its own pool", () => {
  const c = makeCombatant();

  applyShield(c, 300);
  applyShield(c, 200);

  expect(c.shields).toHaveLength(2);
  expect(c.shields.map((s) => s.remaining)).toEqual([300, 200]);
});
