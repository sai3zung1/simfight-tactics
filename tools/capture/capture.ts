import { readInstalledClient } from "./client";
import { formatShape, probe } from "./probe";

const USAGE = "usage: bun run capture --probe <install root>";

export function run(args: readonly string[]): string {
  if (args[0] !== "--probe" || !args[1]) {
    throw new Error(USAGE);
  }
  return formatShape(probe(readInstalledClient(args[1])));
}

if (import.meta.main) {
  try {
    console.log(run(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
