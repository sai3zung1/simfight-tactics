import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isComplete, RECORD, type CaptureRecord } from "./capture-dir";
import { DIGEST, type Digest } from "./digest";
import { INVENTORY, type Inventory } from "./inventory";
import { INDEX, type CapturedImage } from "./textures";
import { REFUSALS, type Refusal } from "./refusals";

export type Change =
  | { readonly kind: "gained"; readonly family: string; readonly entry: string }
  | { readonly kind: "lost"; readonly family: string; readonly entry: string }
  | {
      readonly kind: "moved";
      readonly file: string;
      readonly at: string;
      readonly from: unknown;
      readonly to: unknown;
    };

function read<T>(capture: string, file: string): T {
  return JSON.parse(readFileSync(join(capture, file), "utf8")) as T;
}

function taken(capture: string): CaptureRecord {
  if (!isComplete(capture)) {
    // A half-written capture reads its own holes as changes.
    throw new Error(`${capture} is not a complete capture`);
  }
  return read<CaptureRecord>(capture, RECORD);
}

function digest(capture: string): Digest {
  try {
    return read<Digest>(capture, DIGEST);
  } catch {
    // Without it every file has to be opened, and equality cannot be trusted.
    throw new Error(`${capture} carries no ${DIGEST}, which #197 writes`);
  }
}

function keyed(images: readonly CapturedImage[]): Map<string, CapturedImage> {
  return new Map(images.map((image) => [image.file, image]));
}

function sided<T>(
  before: ReadonlyMap<string, T>,
  after: ReadonlyMap<string, T>,
  family: string,
): Change[] {
  const changes: Change[] = [];
  for (const entry of after.keys()) {
    if (!before.has(entry)) changes.push({ kind: "gained", family, entry });
  }
  for (const entry of before.keys()) {
    if (!after.has(entry)) changes.push({ kind: "lost", family, entry });
  }
  return changes;
}

function held(inventory: Inventory, family: string): Map<string, unknown> {
  return new Map((inventory[family] ?? []).map((entry) => [entry.id, entry]));
}

// One row per differing path, carrying both sides. An object is walked into; a
// value is reported where it sits.
function walked(
  file: string,
  at: string,
  before: unknown,
  after: unknown,
): Change[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];

  const both =
    before !== null &&
    after !== null &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after);
  if (!both) return [{ kind: "moved", file, at, from: before, to: after }];

  const keys = new Set([
    ...Object.keys(before as object),
    ...Object.keys(after as object),
  ]);
  return [...keys]
    .sort()
    .flatMap((key) =>
      walked(
        file,
        at.length === 0 ? key : `${at}.${key}`,
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
      ),
    );
}

export function compare(before: string, after: string): readonly Change[] {
  const was = taken(before);
  const is = taken(after);
  if (was.set !== is.set) {
    // Two sets differ everywhere, and the report would say nothing.
    throw new Error(`set ${was.set} and set ${is.set} are not one comparison`);
  }

  const wasDigest = digest(before);
  const isDigest = digest(after);
  const changes: Change[] = [];

  const wasHeld = read<Inventory>(before, INVENTORY);
  const isHeld = read<Inventory>(after, INVENTORY);
  for (const family of [
    ...new Set([...Object.keys(wasHeld), ...Object.keys(isHeld)]),
  ].sort()) {
    changes.push(...sided(held(wasHeld, family), held(isHeld, family), family));
  }

  changes.push(
    ...sided(
      keyed(read<CapturedImage[]>(before, INDEX)),
      keyed(read<CapturedImage[]>(after, INDEX)),
      "assets",
    ),
  );
  changes.push(
    ...sided(
      new Map(read<Refusal[]>(before, REFUSALS).map((r) => [r.path, r])),
      new Map(read<Refusal[]>(after, REFUSALS).map((r) => [r.path, r])),
      "refusals",
    ),
  );

  // The digests say which files to open. Two captures of one set differ in a
  // handful, and opening only those is what makes the comparison fit in a day.
  const walkable = [
    ...new Set([...Object.keys(wasDigest), ...Object.keys(isDigest)]),
  ].sort();
  for (const file of walkable) {
    if (wasDigest[file] === isDigest[file]) continue;

    const inventoried =
      file === INVENTORY || file === INDEX || file === REFUSALS;
    if (inventoried || !file.endsWith(".json")) {
      if (wasDigest[file] === undefined) {
        changes.push({ kind: "gained", family: "files", entry: file });
      } else if (isDigest[file] === undefined) {
        changes.push({ kind: "lost", family: "files", entry: file });
      }
      continue;
    }
    if (wasDigest[file] === undefined || isDigest[file] === undefined) {
      changes.push({
        kind: wasDigest[file] === undefined ? "gained" : "lost",
        family: "files",
        entry: file,
      });
      continue;
    }
    changes.push(...walked(file, "", read(before, file), read(after, file)));
  }

  return changes;
}

export function formatChanges(changes: readonly Change[]): string {
  if (changes.length === 0) return "nothing moved";

  const counted = new Map<string, number>();
  for (const change of changes) {
    const where =
      change.kind === "moved"
        ? `moved  ${change.file}`
        : `${change.kind} ${change.family}`;
    counted.set(where, (counted.get(where) ?? 0) + 1);
  }

  const said = [...counted.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([where, n]) => `  ${where} — ${n}`);
  return [`${changes.length} changes`, ...said].join("\n");
}
