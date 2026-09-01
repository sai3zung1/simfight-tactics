import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

export const DIGEST = "digest.json";

export type Digest = Readonly<Record<string, string>>;

// The one door every JSON file in a capture is written through. Key order is
// the sorted order rather than the order a reader happened to produce, so two
// runs of one client write the same bytes.
export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, sorted, 2)}\n`);
}

function sorted(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
  );
}

export function digestCapture(
  path: string,
  except: readonly string[] = [],
): Digest {
  const digest: Record<string, string> = {};
  for (const at of files(path)) {
    if (at === DIGEST || except.includes(at)) continue;

    try {
      digest[at] = createHash("sha256")
        .update(readFileSync(join(path, at)))
        .digest("hex");
    } catch {
      // A digest with a hole claims more than it checked.
      throw new Error(`${at} cannot be read, so ${path} cannot be digested`);
    }
  }
  return digest;
}

export function writeDigest(
  path: string,
  except: readonly string[] = [],
): void {
  writeJson(join(path, DIGEST), digestCapture(path, except));
}

function files(path: string): readonly string[] {
  return readdirSync(path, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(path, join(entry.parentPath, entry.name)).split(sep).join("/"),
    )
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
