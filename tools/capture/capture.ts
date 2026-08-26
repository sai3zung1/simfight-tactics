import { readInstalledClient } from "./client";
import { formatShape, probe } from "./probe";
import { countReadableFiles } from "./reader";

const USAGE = "usage: bun run capture (--probe | --read) <install root>";

export function run(args: readonly string[]): string {
  const [mode, installRoot] = args;
  if (!installRoot) {
    throw new Error(USAGE);
  }

  const client = readInstalledClient(installRoot);
  switch (mode) {
    case "--probe":
      return formatShape(probe(client));
    case "--read":
      return `${client.branch} — ${countReadableFiles(client)} files the reader can see`;
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
