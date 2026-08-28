import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { InstalledClient } from "./client";
import type { CurveTablesRead } from "./reader";

export const CAPTURES = "captures";

export function captureDirName(set: string, on: Date): string {
  return `set-${set}-${on.toISOString().slice(0, 10)}`;
}

export function createCaptureDir(
  set: string,
  on: Date,
  into: string = CAPTURES,
): string {
  const path = join(into, captureDirName(set, on));
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
  writeFileSync(
    join(path, "capture.json"),
    `${JSON.stringify(record, null, 2)}\n`,
  );
}
