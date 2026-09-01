import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";

export const CAPTURES = "captures";
export const RECORD = "capture.json";

export type Counted = {
  readonly read: number;
  readonly refused: number;
};

export type CaptureRecord = {
  readonly branch: string;
  readonly build: string;
  readonly capturedOn: string;
  readonly counts: Readonly<Record<string, Counted>>;
  readonly set: string;
};

// The branch is part of what a capture is: PBE and Live ship different builds of
// the same set, so a name that leaves it out makes the second one of a day
// collide with the first.
export function captureDirName(set: string, branch: string, on: Date): string {
  return `set-${set}-${branch}-${on.toISOString().slice(0, 10)}`;
}

// The record is what marks a capture finished, so its presence is the question
// asked before anything is written or removed.
export function isComplete(path: string): boolean {
  return existsSync(join(path, RECORD));
}

export function createCaptureDir(
  set: string,
  branch: string,
  on: Date,
  into: string = CAPTURES,
): string {
  const path = join(into, captureDirName(set, branch, on));
  if (isComplete(path)) {
    throw new Error(`a capture already sits at ${path}`);
  }

  // What is left here carries no record, so a run failed part-way through it.
  // That is not a capture, and keeping it would make the operator delete by hand
  // what the chain already knows is junk.
  rmSync(path, { force: true, recursive: true });
  mkdirSync(path, { recursive: true });
  return path;
}

export function writeCaptureRecord(
  path: string,
  client: InstalledClient,
  set: string,
  on: Date,
  counts: CaptureRecord["counts"],
): void {
  const record: CaptureRecord = {
    branch: client.branch,
    build: client.build,
    // To the second, in UTC. The directory name already carries a date, and a
    // local one would name two different days for one instant depending on
    // where the run happened.
    capturedOn: `${on.toISOString().slice(0, 19)}Z`,
    counts,
    set,
  };
  writeJson(join(path, RECORD), record);
}
