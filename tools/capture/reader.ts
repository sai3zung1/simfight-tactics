import { join } from "node:path";
import type { InstalledClient } from "./client";

const PROJECT = join("tools", "capture", "reader", "reader.csproj");
const BUILT = join("tools", "capture", "reader", "bin", "capture");

function said(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes).trim();
}

// The reader is built before it is run, and run as its own binary rather than
// through `dotnet run`: that command writes its build output to the same stream
// as the program, and a warning would then read as a result.
function build(): void {
  const run = Bun.spawnSync(
    [
      "dotnet",
      "build",
      PROJECT,
      "-c",
      "Release",
      "-o",
      BUILT,
      "-v",
      "quiet",
      "--nologo",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (run.exitCode !== 0) {
    throw new Error(
      said(run.stderr) || said(run.stdout) || "the reader did not build",
    );
  }
}

export function countReadableFiles(client: InstalledClient): number {
  build();

  const run = Bun.spawnSync(
    ["dotnet", join(BUILT, "reader.dll"), client.paks],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (run.exitCode !== 0) {
    throw new Error(
      said(run.stderr) ||
        `the reader exited with ${run.exitCode} and said nothing`,
    );
  }

  const printed = said(run.stdout);
  const count = Number(printed);
  if (!Number.isInteger(count)) {
    throw new Error(`the reader printed ${printed} where a file count was due`);
  }
  return count;
}
