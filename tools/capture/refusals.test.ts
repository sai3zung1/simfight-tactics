import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRefusals, REFUSALS, writeRefusals } from "./refusals";

function into(): string {
  return mkdtempSync(join(tmpdir(), "sft-refusals-"));
}

test("reads a path and the check that refused it", () => {
  expect(
    readRefusals("Set_18/CT_Ahri.uasset\ta row count of 33685504"),
  ).toEqual([
    { path: "Set_18/CT_Ahri.uasset", reason: "a row count of 33685504" },
  ]);
});

test("reads every line the reader wrote, whatever ends them", () => {
  expect(readRefusals("a\tone\r\nb\ttwo\n")).toHaveLength(2);
});

test("orders refusals by path, so two runs write the same file", () => {
  expect(readRefusals("z\tone\na\ttwo").map((r) => r.path)).toEqual(["a", "z"]);
});

test("says nothing was refused when the reader said nothing", () => {
  expect(readRefusals("")).toEqual([]);
});

test("refuses a line that is not a refusal", () => {
  expect(() => readRefusals("something went wrong")).toThrow(
    "which is not a refusal",
  );
});

test("refuses a refusal that names no reason", () => {
  expect(() => readRefusals("Set_18/CT_Ahri.uasset\t")).toThrow(
    "which is not a refusal",
  );
});

test("writes the refusals into the capture", () => {
  const where = into();
  writeRefusals(where, [{ path: "b", reason: "two" }]);
  expect(JSON.parse(readFileSync(join(where, REFUSALS), "utf8"))).toEqual([
    { path: "b", reason: "two" },
  ]);
});

test("writes an empty list rather than no file", () => {
  const where = into();
  writeRefusals(where, []);
  expect(JSON.parse(readFileSync(join(where, REFUSALS), "utf8"))).toEqual([]);
});
