import { createCaptureDir } from "./capture-dir";
import { readInstalledClient } from "./client";
import { formatShape, probe } from "./probe";
import { countReadableFiles } from "./reader";

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
    case "--capture":
      if (!set) throw new Error(USAGE);
      return createCaptureDir(client, set, new Date());
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
