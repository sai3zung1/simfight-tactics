import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";
import type { CurveTablesRead } from "./reader";

export const CAPTURES = "captures";
export const RECORD = "capture.json";

// The branch is part of what a capture is: PBE and Live ship different builds of
// the same set, so a name that leaves it out makes the second one of a day
// collide with the first.
export function captureDirName(set: string, branch: string, on: Date): string {
  return `set-${set}-${branch}-${on.toISOString().slice(0, 10)}`;
}

export function createCaptureDir(
  set: string,
  branch: string,
  on: Date,
  into: string = CAPTURES,
): string {
  const path = join(into, captureDirName(set, branch, on));
  if (existsSync(path)) {
    throw new Error(`a capture already sits at ${path}`);
  }

  mkdirSync(path, { recursive: true });
  return path;
}

export function writeCaptureRecord(
  path: string,
  client: InstalledClient,
  set: string,
  read: CurveTablesRead,
): void {
  const record = {
    set,
    branch: client.branch,
    build: client.build,
    curveTables: { read: read.written, refused: read.refused },
  };
  writeJson(join(path, RECORD), record);
}
