import type { BoardSide } from "../domain/combat/board-side";
import type { Modifier } from "../domain/catalog/modifier";
import type { ItemId } from "../domain/primitives";

/**
 * Stand-in modifier source until the item, augment, unit and trait catalogs
 * land (#13/#28/#39/#40). Two test-facing items resolve to fixed modifier
 * lists; any other id resolves to none (ADR 0002 — the engine still doesn't
 * know real items). The signature is the part meant to survive: the catalogs
 * swap this body, callers stay put. Traits and augments join when their
 * catalogs land.
 */

/** Attacker-side fixture: one flat attack-damage stat-mod. */
export const PROVISIONAL_SWORD_ITEM_ID = "provisional-sword" as ItemId;

/**
 * Defender-side fixture, carrying two modifiers on purpose — a stat-mod
 * raising the durability stat and a standalone damage-reduction effect — so
 * one item exercises both reduction paths of `reductionFactor` end to end.
 */
export const PROVISIONAL_PLATING_ITEM_ID = "provisional-plating" as ItemId;

const PROVISIONAL_ITEM_MODIFIERS: Readonly<
  Record<ItemId, readonly Modifier[]>
> = {
  [PROVISIONAL_SWORD_ITEM_ID]: [
    {
      kind: "stat-mod",
      target: "attackDamage",
      amount: { base: 30 },
      temporality: { kind: "instant" },
    },
  ],
  [PROVISIONAL_PLATING_ITEM_ID]: [
    {
      kind: "stat-mod",
      target: "durability",
      amount: { base: 0.1 },
      temporality: { kind: "instant" },
    },
    {
      kind: "damage-reduction",
      amount: { base: 0.1 },
      temporality: { kind: "instant" },
    },
  ],
};

/** Resolve one side's declared items to the modifiers they grant. */
export function resolveModifiers(side: BoardSide): readonly Modifier[] {
  const itemIds: readonly ItemId[] = side.itemIds;
  return itemIds.flatMap((id) => PROVISIONAL_ITEM_MODIFIERS[id] ?? []);
}
