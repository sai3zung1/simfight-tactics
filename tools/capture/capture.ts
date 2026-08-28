import { join } from "node:path";
import { createCaptureDir, writeCaptureRecord } from "./capture-dir";
import { readInstalledClient } from "./client";
import { formatShape, probe } from "./probe";
import { countReadableFiles, decodeCurveTables } from "./reader";

const USAGE =
  "usage: bun run capture (--probe <install root> | --read <install root> | --capture <install root> <set>)";

export function run(args: readonly string[]): string {
  const [mode, installRoot, set] = args;
  if (!installRoot) {
    throw new Error(USAGE);
  }

  const client = readInstalledClient(installRoot);
  switch (mode) {
    case "--probe":
      return formatShape(probe(client));
    case "--read":
      return `${client.branch} — ${countReadableFiles(client)} files the reader can see`;
    case "--capture": {
      if (!set) throw new Error(USAGE);
      const path = createCaptureDir(set, client.branch, new Date());
      const read = decodeCurveTables(client, join(path, "curve-tables"));
      writeCaptureRecord(path, client, set, read);
      return `${path} — ${read.written} curve tables, ${read.refused} refused`;
    }
    default:
      throw new Error(USAGE);
  }
}

if (import.meta.main) {
  try {
    console.log(run(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
