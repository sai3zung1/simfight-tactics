import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RECORD,
  type CaptureRecord,
  type Counted as Read,
} from "./capture-dir";
import { writeJson } from "./digest";
import { IDENTIFIERS } from "./identifier";
import { INVENTORY, type Inventory } from "./inventory";
import { REFUSALS, type Refusal } from "./refusals";
import { TAGS } from "./tags";
import { TEXT } from "./text";
import { INDEX, type CapturedImage } from "./textures";

export const COVERAGE = "coverage.json";

export type Counted = {
  readonly found: number;
  readonly read: number;
  readonly refused: number;
  readonly silent: number;
};

export type Coverage = {
  readonly curveTables: Counted;
  readonly families: Readonly<
    Record<string, Readonly<Record<string, Counted>>>
  >;
  readonly unproduced: readonly string[];
};

// What no reading in the chain attempts at all. A gap is a decision and a
// refusal is a failure, and folding the two together hides both.
const UNPRODUCED = [
  "augments.grants — hand-written until #206",
  "items.grants — hand-written until #206",
  "traits.grants — hand-written until #206",
  "wisps.grants — hand-written until #206",
  "entries.applies — hand-written until #206",
  "entries.combat — a reading a person makes, never data Riot ships",
  "entries.requiresRunInput — a reading a person makes, never data Riot ships",
];

function read<T>(capture: string, file: string): T {
  return JSON.parse(readFileSync(join(capture, file), "utf8")) as T;
}

function counted(found: number, read: number, refused: number): Counted {
  return { found, read, refused, silent: found - read - refused };
}

/// `tables` comes from the run rather than from the record, so the record can be
/// written once, last, after this has been counted.
export function coverageOf(capture: string, tables: Read): Coverage {
  const inventory = read<Inventory>(capture, INVENTORY);
  const refusals = read<Refusal[]>(capture, REFUSALS);

  const readings: Readonly<Record<string, ReadonlySet<string>>> = {
    text: new Set(Object.keys(read<object>(capture, TEXT))),
    tags: new Set(
      Object.entries(read<Record<string, readonly string[]>>(capture, TAGS))
        .filter(([, tags]) => tags.length > 0)
        .map(([entry]) => entry),
    ),
    identifiers: new Set(Object.keys(read<object>(capture, IDENTIFIERS))),
    textures: new Set(
      read<CapturedImage[]>(capture, INDEX).map((image) => image.entry),
    ),
  };

  const families: Record<string, Record<string, Counted>> = {};
  for (const [family, entries] of Object.entries(inventory)) {
    const ids = entries.map((entry) => entry.id);
    families[family] = {};
    for (const [reading, held] of Object.entries(readings)) {
      const refused = refusals.filter(
        (refusal) => refusal.reading === reading && ids.includes(refusal.path),
      ).length;
      families[family][reading] = counted(
        ids.length,
        ids.filter((id) => held.has(id)).length,
        refused,
      );
    }
  }

  const curveTables = counted(
    tables.read + tables.refused,
    tables.read,
    tables.refused,
  );

  for (const [family, byReading] of Object.entries(families)) {
    for (const [reading, held] of Object.entries(byReading)) {
      if (held.silent >= 0) continue;
      // An entry counted twice, or read without being in the inventory: either
      // way the chain lost track of it, which is worse than not reading it.
      throw new Error(
        `${family}.${reading} read ${held.read} and refused ${held.refused} of ${held.found}`,
      );
    }
  }

  return { curveTables, families, unproduced: UNPRODUCED };
}

/// The coverage a finished capture already carries, for a reader that wants it
/// without taking one.
export function coverageIn(capture: string): Coverage {
  return read<Coverage>(capture, COVERAGE);
}

export function readingOf(capture: string): Read {
  return (
    read<CaptureRecord>(capture, RECORD).counts.curveTables ?? {
      read: 0,
      refused: 0,
    }
  );
}

export function writeCoverage(into: string, coverage: Coverage): void {
  writeJson(join(into, COVERAGE), coverage);
}

export function formatCoverage(coverage: Coverage): string {
  const said = Object.entries(coverage.families)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([family, byReading]) =>
      Object.entries(byReading)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([reading, held]) =>
            `  ${family}.${reading} — ${held.read} read, ${held.refused} refused, ${held.silent} silent of ${held.found}`,
        ),
    );
  const { curveTables: tables } = coverage;
  return [
    `curve tables — ${tables.read} of ${tables.found}`,
    ...said,
    `${coverage.unproduced.length} readings the chain does not attempt`,
  ].join("\n");
}
