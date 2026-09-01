import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  captureDirName,
  createCaptureDir,
  isComplete,
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

const COUNTS = { curveTables: { read: 667, refused: 0 } };

function writeRecordAt(path: string): string {
  writeCaptureRecord(path, CLIENT, "18", ON, COUNTS);
  return path;
}

function into(): string {
  return mkdtempSync(join(tmpdir(), "sft-captures-"));
}

test("names a capture for its set and the day it was taken", () => {
  expect(captureDirName("18", "Live", ON)).toBe("set-18-Live-2026-08-26");
});

test("writes the branch, the build and the moment the capture came from", () => {
  const path = writeRecordAt(createCaptureDir("18", "Live", ON, into()));
  const written = JSON.parse(readFileSync(join(path, "capture.json"), "utf8"));
  expect(written).toEqual({
    set: "18",
    branch: "Live",
    build: "++tft+rls-18.1.0",
    capturedOn: "2026-08-26T13:00:00Z",
    counts: { curveTables: { read: 667, refused: 0 } },
  });
});

test("one instant names the directory and the record alike, across midnight", () => {
  const midnight = new Date("2026-08-26T23:59:58Z");
  const path = createCaptureDir("18", "Live", midnight, into());
  writeCaptureRecord(path, CLIENT, "18", midnight, COUNTS);
  const written = JSON.parse(readFileSync(join(path, "capture.json"), "utf8"));

  expect(path.endsWith("set-18-Live-2026-08-26")).toBe(true);
  expect(written.capturedOn).toBe("2026-08-26T23:59:58Z");
});

test("a directory is not complete until the record is in it", () => {
  const path = createCaptureDir("18", "Live", ON, into());
  expect(isComplete(path)).toBe(false);
  writeRecordAt(path);
  expect(isComplete(path)).toBe(true);
});

test("refuses to retake a complete capture of the same set on the same day", () => {
  const where = into();
  const first = writeRecordAt(createCaptureDir("18", "Live", ON, where));
  expect(() => createCaptureDir("18", "Live", ON, where)).toThrow(first);
});

test("leaves the first capture untouched when it refuses", () => {
  const where = into();
  const first = writeRecordAt(createCaptureDir("18", "Live", ON, where));
  const before = readFileSync(join(first, "capture.json"), "utf8");
  expect(() => createCaptureDir("18", "Live", ON, where)).toThrow();
  expect(readFileSync(join(first, "capture.json"), "utf8")).toBe(before);
});

test("replaces what a run that failed part-way left behind", () => {
  const where = into();
  const half = createCaptureDir("18", "Live", ON, where);
  mkdirSync(join(half, "curve-tables"));
  expect(existsSync(join(half, "curve-tables"))).toBe(true);

  const again = createCaptureDir("18", "Live", ON, where);
  expect(again).toBe(half);
  expect(existsSync(join(again, "curve-tables"))).toBe(false);
});

test("the same set on two branches is two captures", () => {
  const where = into();
  writeRecordAt(createCaptureDir("18", "Live", ON, where));
  const pbe = createCaptureDir("18", "PBE", ON, where);
  expect(pbe.endsWith("set-18-PBE-2026-08-26")).toBe(true);
});

test("a later day is a capture of its own", () => {
  const where = into();
  writeRecordAt(createCaptureDir("18", "Live", ON, where));
  const next = createCaptureDir(
    "18",
    "Live",
    new Date("2026-08-27T09:00:00Z"),
    where,
  );
  expect(next.endsWith("set-18-Live-2026-08-27")).toBe(true);
});
