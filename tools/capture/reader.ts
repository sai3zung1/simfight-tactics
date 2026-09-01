import { join } from "node:path";
import type { InstalledClient } from "./client";
import { readRefusals, type Refusal } from "./refusals";

const PROJECT = join("tools", "capture", "reader", "reader.csproj");
const BUILT = join("tools", "capture", "reader", "bin", "capture");
// The client writes an object's values without their names. This restores the
// two the reader needs, and it holds no value of Riot's — only the shape of a
// container, which is why it is ours to write rather than someone else's to dump.
const MAPPINGS = join("tools", "capture", "mappings", "engine-types.json");

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

function reader(client: InstalledClient, rest: readonly string[]) {
  build();
  return Bun.spawnSync(
    ["dotnet", join(BUILT, "reader.dll"), client.paks, ...rest],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, SFT_MAPPINGS: MAPPINGS },
    },
  );
}

export type ReaderSaid = {
  readonly printed: string;
  readonly refusals: readonly Refusal[];
};

// One door onto the reader: what it printed, and what it refused. Every mode
// answers on those two streams and nothing reads them separately.
export function readReader(
  client: InstalledClient,
  rest: readonly string[],
): ReaderSaid {
  const run = reader(client, rest);
  if (run.exitCode !== 0) {
    throw new Error(
      said(run.stderr) ||
        `the reader exited with ${run.exitCode} and said nothing`,
    );
  }
  return {
    printed: said(run.stdout),
    // The mode is the reading, so a refusal carries what refused it.
    refusals: readRefusals(said(run.stderr), rest[0] ?? "files"),
  };
}

export function countReadableFiles(client: InstalledClient): number {
  const printed = readReader(client, []).printed;
  const count = Number(printed);
  if (!Number.isInteger(count)) {
    throw new Error(`the reader printed ${printed} where a file count was due`);
  }
  return count;
}

export type CurveTablesRead = {
  readonly written: number;
  readonly refused: number;
  readonly refusals: readonly Refusal[];
};

export function decodeCurveTables(
  client: InstalledClient,
  into: string,
): CurveTablesRead {
  const heard = readReader(client, ["curve-tables", into]);
  const [written, refused] = heard.printed.split(/\s+/).map(Number);
  if (!Number.isInteger(written) || !Number.isInteger(refused)) {
    throw new Error(
      `the reader printed ${heard.printed} where two counts were due`,
    );
  }
  if (heard.refusals.length !== refused) {
    // One of the two is wrong and neither can be preferred over the other.
    throw new Error(
      `the reader counted ${refused} refusals and named ${heard.refusals.length}`,
    );
  }
  return { written, refused, refusals: heard.refusals };
}
