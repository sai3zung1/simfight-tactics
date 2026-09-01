import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lines, parseText, TEXT, writeText } from "./text";

const NAME = {
  component: "TFTNameDataComponent",
  key: "7F1C9B354F4142CF5C95AC8797260531",
  source: "Ahri",
};

const DESCRIPTION = {
  component: "TFTSpellDescriptionDataComponent",
  key: "B0D5748C4D23EB8F353A659807DBE509",
  source:
    'Launch a spirit bomb at the location within <TFTCurveTable row="AbilityCenterHexRange"/> hexes.',
};

function printed(value: unknown): string {
  return JSON.stringify(value);
}

test("reads a text under the component that holds it", () => {
  expect(parseText(printed({ DA_18_Ahri: [NAME] }))).toEqual({
    DA_18_Ahri: [NAME],
  });
});

test("keeps a template as the client wrote it", () => {
  const read = parseText(printed({ DA_18_Ahri: [DESCRIPTION] }));
  expect(read.DA_18_Ahri?.[0]?.source).toBe(DESCRIPTION.source);
});

test("keeps two texts of one component apart", () => {
  const both = { component: "TFTSpellDataComponent", key: "A", source: "one" };
  const read = parseText(
    printed({ DA_18_Ahri: [both, { ...both, key: "B", source: "two" }] }),
  );
  expect(read.DA_18_Ahri).toHaveLength(2);
});

test("refuses an entry that came back with nothing", () => {
  expect(() => parseText(printed({ DA_18_Ahri: [] }))).toThrow(
    "came back with no text",
  );
});

test("refuses a text with no component", () => {
  expect(() =>
    parseText(printed({ DA_18_Ahri: [{ key: "A", source: "one" }] })),
  ).toThrow("missing a component");
});

test("refuses a text with no source", () => {
  expect(() =>
    parseText(printed({ DA_18_Ahri: [{ component: "x", key: "A" }] })),
  ).toThrow("missing a component");
});

test("refuses something that is not a set of entries", () => {
  expect(() => parseText("[]")).toThrow("no text at all");
});

test("counts every line across every entry", () => {
  expect(lines({ a: [NAME, DESCRIPTION], b: [NAME] })).toBe(3);
});

test("writes the text into the capture, under entries", () => {
  const where = mkdtempSync(join(tmpdir(), "sft-text-"));
  writeText(where, { DA_18_Ahri: [NAME] });
  expect(JSON.parse(readFileSync(join(where, TEXT), "utf8"))).toEqual({
    DA_18_Ahri: [NAME],
  });
});
