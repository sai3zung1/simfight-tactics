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

const READ = { written: 997, refused: 92 };

function writeRecordAt(path: string): string {
  writeCaptureRecord(path, CLIENT, "18", READ);
  return path;
}

function into(): string {
  return mkdtempSync(join(tmpdir(), "sft-captures-"));
}

test("names a capture for its set and the day it was taken", () => {
  expect(captureDirName("18", ON)).toBe("set-18-2026-08-26");
});

test("writes the branch and the build the capture came from", () => {
  const path = writeRecordAt(createCaptureDir("18", ON, into()));
  const written = JSON.parse(readFileSync(join(path, "capture.json"), "utf8"));
  expect(written).toEqual({
    set: "18",
    branch: "Live",
    build: "++tft+rls-18.1.0",
    curveTables: { read: 997, refused: 92 },
  });
});

test("refuses a second capture of the same set on the same day", () => {
  const where = into();
  const first = createCaptureDir("18", ON, where);
  expect(() => createCaptureDir("18", ON, where)).toThrow(first);
});

test("leaves the first capture untouched when it refuses", () => {
  const where = into();
  const first = writeRecordAt(createCaptureDir("18", ON, where));
  const before = readFileSync(join(first, "capture.json"), "utf8");
  expect(() => createCaptureDir("18", ON, where)).toThrow();
  expect(readFileSync(join(first, "capture.json"), "utf8")).toBe(before);
});

test("a later day is a capture of its own", () => {
  const where = into();
  createCaptureDir("18", ON, where);
  const next = createCaptureDir("18", new Date("2026-08-27T09:00:00Z"), where);
  expect(next.endsWith("set-18-2026-08-27")).toBe(true);
});
