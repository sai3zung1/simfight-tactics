import { expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { digestCapture, writeDigest, writeJson } from "./digest";

function into(): string {
  return mkdtempSync(join(tmpdir(), "sft-digest-"));
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

test("writes an object's keys in sorted order, however they arrived", () => {
  const path = join(into(), "out.json");
  writeJson(path, { zebra: 1, apple: 2, Mango: 3 });
  expect(read(path)).toBe('{\n  "Mango": 3,\n  "apple": 2,\n  "zebra": 1\n}\n');
});

test("sorts nested objects too", () => {
  const path = join(into(), "out.json");
  writeJson(path, { outer: { b: 1, a: 2 } });
  expect(JSON.stringify(JSON.parse(read(path)))).toBe(
    '{"outer":{"a":2,"b":1}}',
  );
});

test("leaves an array in the order it was given", () => {
  const path = join(into(), "out.json");
  writeJson(path, { rows: ["zebra", "apple"] });
  expect(JSON.parse(read(path))).toEqual({ rows: ["zebra", "apple"] });
});

test("ends the file with one newline", () => {
  const path = join(into(), "out.json");
  writeJson(path, {});
  expect(read(path).endsWith("}\n")).toBe(true);
});

test("hashes every file under the capture, by its capture-relative path", () => {
  const where = into();
  mkdirSync(join(where, "curve-tables"));
  writeJson(join(where, "curve-tables", "CT_Role_Stats.json"), { a: 1 });
  writeJson(join(where, "inventory.json"), { b: 2 });

  expect(Object.keys(digestCapture(where))).toEqual([
    "curve-tables/CT_Role_Stats.json",
    "inventory.json",
  ]);
});

test("gives the same hash for the same bytes", () => {
  const one = into();
  const two = into();
  writeJson(join(one, "inventory.json"), { b: 2, a: 1 });
  writeJson(join(two, "inventory.json"), { a: 1, b: 2 });

  expect(digestCapture(one)).toEqual(digestCapture(two));
});

test("leaves out the files it is told to, and itself", () => {
  const where = into();
  writeJson(join(where, "inventory.json"), { a: 1 });
  writeJson(join(where, "capture.json"), { set: "18" });
  writeDigest(where, ["capture.json"]);

  expect(Object.keys(JSON.parse(read(join(where, "digest.json"))))).toEqual([
    "inventory.json",
  ]);
});

// Windows keeps a file readable through a mode change, so the refusal cannot be
// staged there. Skipping says so, where a test that passed anyway would not.
test.skipIf(process.platform === "win32")(
  "refuses to digest a capture holding a file it cannot read",
  () => {
    const where = into();
    const shut = join(where, "inventory.json");
    writeJson(shut, { a: 1 });
    chmodSync(shut, 0o000);

    try {
      expect(() => digestCapture(where)).toThrow("inventory.json");
    } finally {
      chmodSync(shut, 0o600);
    }
  },
);

test("refuses a capture directory that is not there", () => {
  expect(() => digestCapture(join(into(), "absent"))).toThrow();
});
