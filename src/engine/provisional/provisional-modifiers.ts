import type { BoardSide } from "../../domain/combat/board-side";
import type { Modifier } from "../../domain/catalog/modifier";
import type { ItemId } from "../../domain/primitives";

export const PROVISIONAL_SWORD_ITEM_ID = "provisional-sword" as ItemId;

export const PROVISIONAL_PLATING_ITEM_ID = "provisional-plating" as ItemId;

export const PROVISIONAL_ROD_ITEM_ID = "provisional-rod" as ItemId;

// Temporality is required by the type but never read on this path: applying
// permanent modifiers only ever switches on kind.
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
  [PROVISIONAL_ROD_ITEM_ID]: [
    {
      kind: "stat-mod",
      target: "abilityPower",
      amount: { base: 0.25 },
      temporality: { kind: "instant" },
    },
  ],
};

// TODO(#13): replaced by the item catalog.
export function resolveModifiers(side: BoardSide): readonly Modifier[] {
  const itemIds: readonly ItemId[] = side.itemIds;
  return itemIds.flatMap((id) => PROVISIONAL_ITEM_MODIFIERS[id] ?? []);
}
