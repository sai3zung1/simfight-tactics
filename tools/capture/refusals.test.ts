import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRefusals, REFUSALS, writeRefusals } from "./refusals";

function into(): string {
  return mkdtempSync(join(tmpdir(), "sft-refusals-"));
}

test("reads a path, the reading, and the check that refused it", () => {
  expect(
    readRefusals("Set_18/CT_Ahri.uasset\ta row count of 33685504", "text"),
  ).toEqual([
    {
      path: "Set_18/CT_Ahri.uasset",
      reading: "text",
      reason: "a row count of 33685504",
    },
  ]);
});

test("reads every line the reader wrote, whatever ends them", () => {
  expect(readRefusals("a\tone\r\nb\ttwo\n", "tags")).toHaveLength(2);
});

test("orders refusals by path, so two runs write the same file", () => {
  expect(readRefusals("z\tone\na\ttwo", "tags").map((r) => r.path)).toEqual([
    "a",
    "z",
  ]);
});

test("stamps every refusal with the reading that made it", () => {
  const read = readRefusals("a\tone\nb\ttwo", "textures");
  expect(read.every((r) => r.reading === "textures")).toBe(true);
});

test("says nothing was refused when the reader said nothing", () => {
  expect(readRefusals("", "text")).toEqual([]);
});

test("refuses a line that is not a refusal", () => {
  expect(() => readRefusals("something went wrong", "text")).toThrow(
    "which is not a refusal",
  );
});

test("refuses a refusal that names no reason", () => {
  expect(() => readRefusals("Set_18/CT_Ahri.uasset\t", "text")).toThrow(
    "which is not a refusal",
  );
});

test("writes the refusals into the capture", () => {
  const where = into();
  writeRefusals(where, [{ path: "b", reading: "tags", reason: "two" }]);
  expect(JSON.parse(readFileSync(join(where, REFUSALS), "utf8"))).toEqual([
    { path: "b", reading: "tags", reason: "two" },
  ]);
});

test("writes an empty list rather than no file", () => {
  const where = into();
  writeRefusals(where, []);
  expect(JSON.parse(readFileSync(join(where, REFUSALS), "utf8"))).toEqual([]);
});
