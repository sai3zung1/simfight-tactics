import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";
import { readReader } from "./reader";
import type { Refusal } from "./refusals";

export const INVENTORY = "inventory.json";

export type InventoryEntry = {
  readonly id: string;
  readonly kind: string;
  readonly path: string;
  readonly cost?: number;
};

export type Inventory = Readonly<Record<string, readonly InventoryEntry[]>>;

export type InventoryRead = {
  readonly inventory: Inventory;
  readonly refusals: readonly Refusal[];
};

export function parseInventory(printed: string): Inventory {
  const read: unknown = JSON.parse(printed);
  if (read === null || typeof read !== "object" || Array.isArray(read)) {
    throw new Error("the reader printed no families at all");
  }

  const inventory: Record<string, readonly InventoryEntry[]> = {};
  for (const [family, entries] of Object.entries(read)) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error(
        `${family} came back with no entry, which is not a family`,
      );
    }

    const seen = new Set<string>();
    for (const entry of entries as readonly InventoryEntry[]) {
      if (!entry.id || !entry.kind || !entry.path) {
        throw new Error(
          `${family} holds an entry missing an id, a kind or a path`,
        );
      }
      if (seen.has(entry.id)) {
        // Everything downstream keys on it, so a repeat would read one entry as
        // two, or two as one.
        throw new Error(`${family} names ${entry.id} twice`);
      }
      seen.add(entry.id);
    }
    inventory[family] = entries as readonly InventoryEntry[];
  }
  return inventory;
}

export function readInventory(
  client: InstalledClient,
  set: string,
): InventoryRead {
  const said = readReader(client, ["inventory", set]);
  return { inventory: parseInventory(said.printed), refusals: said.refusals };
}

export function writeInventory(into: string, inventory: Inventory): void {
  writeJson(join(into, INVENTORY), inventory);
}

export function counted(inventory: Inventory): number {
  return Object.values(inventory).reduce(
    (total, entries) => total + entries.length,
    0,
  );
}
