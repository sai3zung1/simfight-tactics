import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseTags, TAGS, tagged, writeTags } from "./tags";

function printed(value: unknown): string {
  return JSON.stringify(value);
}

test("reads the tags an entry carries, in the client's words", () => {
  expect(
    parseTags(printed({ DA_ArcaneViktory: ["Augment.Tier.Gold"] })),
  ).toEqual({ DA_ArcaneViktory: ["Augment.Tier.Gold"] });
});

test("keeps every namespace, rather than a list of the ones we know", () => {
  const read = parseTags(
    printed({
      DA_18_Ahri: ["Audio.Event.VO.Unit.Purchase", "Role.Magic.Caster"],
    }),
  );
  expect(read.DA_18_Ahri).toHaveLength(2);
});

test("an entry the client tags with nothing carries an empty list", () => {
  expect(parseTags(printed({ DA_18_Ahri: [] }))).toEqual({ DA_18_Ahri: [] });
});

test("refuses a tag with no namespace in it", () => {
  expect(() => parseTags(printed({ DA_18_Ahri: ["Gold"] }))).toThrow(
    "which is not a tag",
  );
});

test("refuses tags that are not a list", () => {
  expect(() => parseTags(printed({ DA_18_Ahri: "Augment.Tier.Gold" }))).toThrow(
    "not a list",
  );
});

test("refuses something that is not a set of entries", () => {
  expect(() => parseTags("[]")).toThrow("no tags at all");
});

test("counts every tag across every entry", () => {
  expect(tagged({ a: ["X.y", "X.z"], b: [], c: ["Y.z"] })).toBe(3);
});

test("writes the tags into the capture, under entries", () => {
  const where = mkdtempSync(join(tmpdir(), "sft-tags-"));
  writeTags(where, { DA_ArcaneViktory: ["Augment.Tier.Gold"] });
  expect(JSON.parse(readFileSync(join(where, TAGS), "utf8"))).toEqual({
    DA_ArcaneViktory: ["Augment.Tier.Gold"],
  });
});
