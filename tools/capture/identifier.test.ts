import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IDENTIFIERS, parseIdentifiers, writeIdentifiers } from "./identifier";

function printed(value: unknown): string {
  return JSON.stringify(value);
}

test("reads the identifier an entry states", () => {
  expect(parseIdentifiers(printed({ DA_18_Ahri: "DA_18_Ahri" }))).toEqual({
    DA_18_Ahri: "DA_18_Ahri",
  });
});

test("keeps an identifier that differs from the entry's own id", () => {
  const read = parseIdentifiers(printed({ DA_18_Akali_AP: "TFT18_Akali" }));
  expect(read.DA_18_Akali_AP).toBe("TFT18_Akali");
});

test("refuses two entries stating the same identifier", () => {
  expect(() =>
    parseIdentifiers(
      printed({ DA_18_Akali_AP: "TFT18_Akali", DA_18_Akali_AD: "TFT18_Akali" }),
    ),
  ).toThrow("both state TFT18_Akali");
});

test("refuses an identifier that is empty", () => {
  expect(() => parseIdentifiers(printed({ DA_18_Ahri: "" }))).toThrow(
    "an identifier that is not one",
  );
});

test("refuses an identifier that is not a string", () => {
  expect(() => parseIdentifiers(printed({ DA_18_Ahri: 4 }))).toThrow(
    "an identifier that is not one",
  );
});

test("refuses something that is not a set of entries", () => {
  expect(() => parseIdentifiers("[]")).toThrow("no identifiers at all");
});

test("says nothing for an entry the client states nothing for", () => {
  const read = parseIdentifiers(printed({ DA_18_Ahri: "DA_18_Ahri" }));
  expect(read.DA_18_AfterShock).toBeUndefined();
});

test("writes the identifiers into the capture, under entries", () => {
  const where = mkdtempSync(join(tmpdir(), "sft-identifiers-"));
  writeIdentifiers(where, { DA_18_Ahri: "DA_18_Ahri" });
  expect(JSON.parse(readFileSync(join(where, IDENTIFIERS), "utf8"))).toEqual({
    DA_18_Ahri: "DA_18_Ahri",
  });
});
