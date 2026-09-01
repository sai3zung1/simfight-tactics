import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  counted,
  INVENTORY,
  parseInventory,
  writeInventory,
} from "./inventory";

const AHRI = {
  id: "DA_18_Ahri",
  kind: "TFTChampionData",
  path: "TFT/Plugins/GameFeatures/Set_18/Content/Champions/Ahri/DA_18_Ahri.uasset",
  cost: 4,
};

const SENTRY = {
  id: "DA_18_Sentry",
  kind: "TFTChampionData",
  path: "TFT/Plugins/GameFeatures/Set_18/Content/Champions/Sentry/DA_18_Sentry.uasset",
};

function printed(value: unknown): string {
  return JSON.stringify(value);
}

test("reads a family and the entries under it", () => {
  expect(parseInventory(printed({ champions: [AHRI] }))).toEqual({
    champions: [AHRI],
  });
});

test("keeps an entry that carries no cost apart from one that does", () => {
  const held = parseInventory(printed({ champions: [AHRI, SENTRY] }));
  expect(held.champions?.[0]?.cost).toBe(4);
  expect(held.champions?.[1]?.cost).toBeUndefined();
});

test("refuses a family with no entry in it", () => {
  expect(() => parseInventory(printed({ champions: [] }))).toThrow(
    "which is not a family",
  );
});

test("refuses an entry with no id", () => {
  expect(() =>
    parseInventory(printed({ champions: [{ kind: "x", path: "y" }] })),
  ).toThrow("missing an id");
});

test("refuses an entry with no kind", () => {
  expect(() =>
    parseInventory(printed({ champions: [{ id: "x", path: "y" }] })),
  ).toThrow("missing an id");
});

test("refuses an id that repeats inside a family", () => {
  expect(() => parseInventory(printed({ champions: [AHRI, AHRI] }))).toThrow(
    "names DA_18_Ahri twice",
  );
});

test("lets one id stand in two families, which the client's tables do", () => {
  const held = parseInventory(
    printed({ champions: [AHRI], charms: [{ ...AHRI, cost: undefined }] }),
  );
  expect(Object.keys(held)).toEqual(["champions", "charms"]);
});

test("refuses something that is not a set of families", () => {
  expect(() => parseInventory("[]")).toThrow("no families at all");
});

test("counts every entry across every family", () => {
  expect(counted({ champions: [AHRI, SENTRY], traits: [AHRI] })).toBe(3);
});

test("writes the inventory into the capture", () => {
  const where = mkdtempSync(join(tmpdir(), "sft-inventory-"));
  writeInventory(where, { champions: [AHRI] });
  expect(JSON.parse(readFileSync(join(where, INVENTORY), "utf8"))).toEqual({
    champions: [AHRI],
  });
});
