import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  captureDirName,
  createCaptureDir,
  writeCaptureRecord,
} from "./capture-dir";
import type { InstalledClient } from "./client";

const CLIENT: InstalledClient = {
  root: "C:/Riot Games/Teamfight Tactics/Live",
  paks: "C:/Riot Games/Teamfight Tactics/Live/TFT/Content/Paks",
  branch: "Live",
  build: "++tft+rls-18.1.0",
};

const ON = new Date("2026-08-26T13:00:00Z");

const READ = { written: 667, refused: 0 };

function writeRecordAt(path: string): string {
  writeCaptureRecord(path, CLIENT, "18", READ);
  return path;
}

function into(): string {
  return mkdtempSync(join(tmpdir(), "sft-captures-"));
}

test("names a capture for its set and the day it was taken", () => {
  expect(captureDirName("18", "Live", ON)).toBe("set-18-Live-2026-08-26");
});

test("writes the branch and the build the capture came from", () => {
  const path = writeRecordAt(createCaptureDir("18", "Live", ON, into()));
  const written = JSON.parse(readFileSync(join(path, "capture.json"), "utf8"));
  expect(written).toEqual({
    set: "18",
    branch: "Live",
    build: "++tft+rls-18.1.0",
    curveTables: { read: 667, refused: 0 },
  });
});

test("refuses a second capture of the same set on the same day", () => {
  const where = into();
  const first = createCaptureDir("18", "Live", ON, where);
  expect(() => createCaptureDir("18", "Live", ON, where)).toThrow(first);
});

test("leaves the first capture untouched when it refuses", () => {
  const where = into();
  const first = writeRecordAt(createCaptureDir("18", "Live", ON, where));
  const before = readFileSync(join(first, "capture.json"), "utf8");
  expect(() => createCaptureDir("18", "Live", ON, where)).toThrow();
  expect(readFileSync(join(first, "capture.json"), "utf8")).toBe(before);
});

test("the same set on two branches is two captures", () => {
  const where = into();
  createCaptureDir("18", "Live", ON, where);
  const pbe = createCaptureDir("18", "PBE", ON, where);
  expect(pbe.endsWith("set-18-PBE-2026-08-26")).toBe(true);
});

test("a later day is a capture of its own", () => {
  const where = into();
  createCaptureDir("18", "Live", ON, where);
  const next = createCaptureDir(
    "18",
    "Live",
    new Date("2026-08-27T09:00:00Z"),
    where,
  );
  expect(next.endsWith("set-18-Live-2026-08-27")).toBe(true);
});
