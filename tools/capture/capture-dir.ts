import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { InstalledClient } from "./client";

export const CAPTURES = "captures";

export function captureDirName(set: string, on: Date): string {
  return `set-${set}-${on.toISOString().slice(0, 10)}`;
}

export function createCaptureDir(
  client: InstalledClient,
  set: string,
  on: Date,
  into: string = CAPTURES,
): string {
  const path = join(into, captureDirName(set, on));
  if (existsSync(path)) {
    throw new Error(`a capture already sits at ${path}`);
  }

  mkdirSync(path, { recursive: true });
  writeFileSync(
    join(path, "capture.json"),
    `${JSON.stringify({ set, branch: client.branch, build: client.build }, null, 2)}\n`,
  );
  return path;
}
