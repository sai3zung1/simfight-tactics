import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeCaptureRecord } from "./capture-dir";
import type { InstalledClient } from "./client";
import { compare, formatChanges } from "./compare";
import { writeDigest, writeJson } from "./digest";
import { writeInventory, type Inventory } from "./inventory";
import { writeRefusals, type Refusal } from "./refusals";
import { writeImageIndex, type CapturedImage } from "./textures";

const CLIENT: InstalledClient = {
  root: "C:/Riot Games/Teamfight Tactics/Live",
  paks: "C:/Riot Games/Teamfight Tactics/Live/TFT/Content/Paks",
  branch: "Live",
  build: "++tft+rls-18.1.0",
};

const AHRI = {
  id: "DA_18_Ahri",
  kind: "TFTChampionData",
  path: "Champions/Ahri/DA_18_Ahri.uasset",
  cost: 4,
};

type Written = {
  readonly set?: string;
  readonly inventory?: Inventory;
  readonly tables?: Readonly<Record<string, unknown>>;
  readonly images?: readonly CapturedImage[];
  readonly refusals?: readonly Refusal[];
  readonly complete?: boolean;
};

// A capture the chain would have written, built through the same writers so the
// test is not a second opinion about what a capture looks like.
function capture(written: Written = {}): string {
  const path = mkdtempSync(join(tmpdir(), "sft-compare-"));
  writeInventory(path, written.inventory ?? { Champions: [AHRI] });
  writeImageIndex(path, written.images ?? []);
  writeRefusals(path, written.refusals ?? []);
  for (const [name, rows] of Object.entries(written.tables ?? {})) {
    writeJson(join(path, "curve-tables", `${name}.json`), rows);
  }
  writeDigest(path, ["capture.json"]);
  if (written.complete !== false) {
    writeCaptureRecord(path, CLIENT, written.set ?? "18", new Date(), {});
  }
  return path;
}

test("reports nothing between a capture and its own twin", () => {
  expect(compare(capture(), capture())).toEqual([]);
});

test("says an entry the later capture holds and the earlier does not", () => {
  const before = capture();
  const after = capture({
    inventory: { Champions: [AHRI, { ...AHRI, id: "DA_KnowYourEnemy" }] },
  });
  expect(compare(before, after)).toContainEqual({
    kind: "gained",
    family: "Champions",
    entry: "DA_KnowYourEnemy",
  });
});

test("says an entry the earlier capture holds and the later does not", () => {
  const before = capture({
    inventory: { Champions: [AHRI, { ...AHRI, id: "DA_Retired" }] },
  });
  expect(compare(before, capture())).toContainEqual({
    kind: "lost",
    family: "Champions",
    entry: "DA_Retired",
  });
});

test("says a value that moved, and carries both sides", () => {
  const before = capture({ tables: { CT_SpreadingRoots: { GoldAmount: 1 } } });
  const after = capture({ tables: { CT_SpreadingRoots: { GoldAmount: 0 } } });
  expect(compare(before, after)).toContainEqual({
    kind: "moved",
    file: "curve-tables/CT_SpreadingRoots.json",
    at: "GoldAmount",
    from: 1,
    to: 0,
  });
});

test("says a row a table gained, where it sits", () => {
  const before = capture({ tables: { CT_SpreadingRoots: { GoldAmount: 1 } } });
  const after = capture({
    tables: { CT_SpreadingRoots: { GoldAmount: 1, Delay: 3 } },
  });
  const moved = compare(before, after);
  expect(moved).toHaveLength(1);
  expect(moved[0]).toMatchObject({ at: "Delay", from: undefined, to: 3 });
});

test("says a table the later capture holds and the earlier does not", () => {
  const after = capture({ tables: { CT_KnowYourEnemy: { Damage: 1 } } });
  expect(compare(capture(), after)).toContainEqual({
    kind: "gained",
    family: "files",
    entry: "curve-tables/CT_KnowYourEnemy.json",
  });
});

test("refuses a capture that was never finished", () => {
  const half = capture({ complete: false });
  expect(() => compare(half, capture())).toThrow("not a complete capture");
  rmSync(half, { recursive: true, force: true });
});

test("refuses two captures of different sets", () => {
  expect(() => compare(capture({ set: "18" }), capture({ set: "19" }))).toThrow(
    "are not one comparison",
  );
});

test("counts what moved rather than listing it", () => {
  expect(formatChanges([])).toBe("nothing moved");
  expect(
    formatChanges([{ kind: "gained", family: "Champions", entry: "x" }]),
  ).toContain("gained Champions — 1");
});
