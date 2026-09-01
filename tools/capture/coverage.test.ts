import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  COVERAGE,
  coverageOf,
  formatCoverage,
  writeCoverage,
} from "./coverage";
import { writeIdentifiers } from "./identifier";
import { writeInventory, type Inventory } from "./inventory";
import { writeRefusals, type Refusal } from "./refusals";
import { writeTags } from "./tags";
import { writeText, type Text } from "./text";
import { writeImageIndex, type CapturedImage } from "./textures";

const AHRI = {
  id: "DA_18_Ahri",
  kind: "TFTChampionData",
  path: "Champions/Ahri/DA_18_Ahri.uasset",
  cost: 4,
};

const SAPLING = { ...AHRI, id: "DA_18_Maokai_Sapling", cost: undefined };

type Written = {
  readonly inventory?: Inventory;
  readonly text?: Text;
  readonly tags?: Readonly<Record<string, readonly string[]>>;
  readonly identifiers?: Readonly<Record<string, string>>;
  readonly images?: readonly CapturedImage[];
  readonly refusals?: readonly Refusal[];
};

function capture(written: Written = {}): string {
  const path = mkdtempSync(join(tmpdir(), "sft-coverage-"));
  writeInventory(path, written.inventory ?? { Champions: [AHRI] });
  writeText(path, written.text ?? {});
  writeTags(path, written.tags ?? {});
  writeIdentifiers(path, written.identifiers ?? {});
  writeImageIndex(path, written.images ?? []);
  writeRefusals(path, written.refusals ?? []);
  return path;
}

const NOTHING = { read: 0, refused: 0 };

test("takes the denominator from the inventory, not from what was read", () => {
  const held = coverageOf(
    capture({ inventory: { Champions: [AHRI, SAPLING] } }),
    NOTHING,
  );
  expect(held.families.Champions?.text?.found).toBe(2);
});

test("counts an entry read once the reading names it", () => {
  const held = coverageOf(
    capture({
      text: {
        DA_18_Ahri: [{ component: "x", key: "y", source: "Ahri" }],
      },
    }),
    NOTHING,
  );
  expect(held.families.Champions?.text).toMatchObject({
    found: 1,
    read: 1,
    refused: 0,
    silent: 0,
  });
});

test("counts a refusal against the reading that made it", () => {
  const held = coverageOf(
    capture({
      inventory: { Champions: [AHRI, SAPLING] },
      text: { DA_18_Ahri: [{ component: "x", key: "y", source: "Ahri" }] },
      refusals: [
        {
          path: "DA_18_Maokai_Sapling",
          reading: "text",
          reason: "carries no text at all",
        },
      ],
    }),
    NOTHING,
  );
  expect(held.families.Champions?.text).toMatchObject({
    found: 2,
    read: 1,
    refused: 1,
    silent: 0,
  });
});

test("calls what the client never states silent, not refused", () => {
  const held = coverageOf(capture(), NOTHING);
  expect(held.families.Champions?.identifiers).toMatchObject({
    found: 1,
    read: 0,
    refused: 0,
    silent: 1,
  });
});

test("an entry tagged with nothing is silent rather than read", () => {
  const held = coverageOf(capture({ tags: { DA_18_Ahri: [] } }), NOTHING);
  expect(held.families.Champions?.tags?.read).toBe(0);
});

test("counts the curve tables from the run rather than from the roster", () => {
  const held = coverageOf(capture(), { read: 667, refused: 92 });
  expect(held.curveTables).toEqual({
    found: 759,
    read: 667,
    refused: 92,
    silent: 0,
  });
});

test("fails when a reading names an entry the inventory does not", () => {
  const written = capture({
    text: {
      DA_18_Ahri: [{ component: "x", key: "y", source: "Ahri" }],
      DA_Invented: [{ component: "x", key: "y", source: "?" }],
    },
    refusals: [
      { path: "DA_18_Ahri", reading: "text", reason: "counted twice" },
    ],
  });
  expect(() => coverageOf(written, NOTHING)).toThrow("Champions.text read 1");
});

test("names what no reading in the chain attempts", () => {
  const held = coverageOf(capture(), NOTHING);
  expect(held.unproduced.join(" ")).toContain("#206");
  expect(held.unproduced.join(" ")).toContain("requiresRunInput");
});

test("writes the coverage into the capture", () => {
  const path = capture();
  const held = coverageOf(path, NOTHING);
  writeCoverage(path, held);
  expect(JSON.parse(readFileSync(join(path, COVERAGE), "utf8"))).toEqual(held);
});

test("says the share read in one line per family and reading", () => {
  const said = formatCoverage(coverageOf(capture(), { read: 667, refused: 0 }));
  expect(said).toContain("curve tables — 667 of 667");
  expect(said).toContain("Champions.text — 0 read, 0 refused, 1 silent of 1");
});
