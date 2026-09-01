import { join } from "node:path";
import { createCaptureDir, RECORD, writeCaptureRecord } from "./capture-dir";
import { checkAgainstDomain, kinds, whatDataCarries } from "./against-domain";
import { compare, formatChanges } from "./compare";
import {
  coverageIn,
  coverageOf,
  formatCoverage,
  writeCoverage,
} from "./coverage";
import { readInstalledClient } from "./client";
import { writeDigest } from "./digest";
import { counted, INVENTORY, readInventory, writeInventory } from "./inventory";
import { formatShape, probe } from "./probe";
import { writeRefusals } from "./refusals";
import { readIdentifiers, writeIdentifiers } from "./identifier";
import { readTags, tagged, writeTags } from "./tags";
import { lines, readText, writeText } from "./text";
import { files, readTextures, writeImageIndex } from "./textures";
import { countReadableFiles, decodeCurveTables } from "./reader";

const USAGE =
  "usage: bun run capture (--probe <install root> | --read <install root> | --capture <install root> <set> | --against-domain | --compare <before> <after> | --coverage <capture>)";

export function run(args: readonly string[]): string {
  const [mode, installRoot, set] = args;

  if (mode === "--compare") {
    const [, before, after] = args;
    if (!before || !after) throw new Error(USAGE);
    return formatChanges(compare(before, after));
  }

  if (mode === "--coverage") {
    const [, capture] = args;
    if (!capture) throw new Error(USAGE);
    return formatCoverage(coverageIn(capture));
  }

  if (mode === "--against-domain") {
    // What the app reads is `src/domain`, and what it reads it from is `data/`.
    // This says where the two disagree; it changes neither.
    const drifts = checkAgainstDomain(whatDataCarries());
    const perKind = kinds(drifts).map((kind) => {
      const held = drifts.filter((d) => `${d.family}.${d.field}` === kind);
      return `  ${kind} — ${held.length}`;
    });
    return [
      `${drifts.length} drifts, of ${kinds(drifts).length} kinds`,
      ...perKind,
    ].join("\n");
  }
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
      // One instant for the whole run. Two writers reading the clock is the
      // fault `data/manifest.json` records: one date, several readings.
      const on = new Date();
      const path = createCaptureDir(set, client.branch, on);
      const held = readInventory(client, set);
      writeInventory(path, held.inventory);

      const said = readText(client, join(path, INVENTORY));
      writeText(path, said.text);

      const stated = readIdentifiers(client, join(path, INVENTORY));
      writeIdentifiers(path, stated.identifiers);

      const classed = readTags(client, join(path, INVENTORY));
      writeTags(path, classed.tags);

      const drawn = readTextures(client, join(path, INVENTORY), path);
      writeImageIndex(path, drawn.images);

      const read = decodeCurveTables(client, join(path, "curve-tables"));
      if (read.written === 0) {
        // A capture that read nothing is not a capture, and the count alone
        // would not say so.
        throw new Error(`nothing was read from ${client.paks}`);
      }

      writeRefusals(path, [
        ...held.refusals,
        ...said.refusals,
        ...stated.refusals,
        ...classed.refusals,
        ...drawn.refusals,
        ...read.refusals,
      ]);
      const counts = {
        curveTables: { read: read.written, refused: read.refused },
        inventory: {
          read: counted(held.inventory),
          refused: held.refusals.length,
        },
        identifiers: {
          read: Object.keys(stated.identifiers).length,
          refused: stated.refusals.length,
        },
        assets: { read: files(drawn.images), refused: drawn.refusals.length },
        tags: { read: tagged(classed.tags), refused: classed.refusals.length },
        text: { read: lines(said.text), refused: said.refusals.length },
      };
      writeCoverage(path, coverageOf(path, counts.curveTables));

      // The digest covers the reading; the record carries the moment, which is
      // the one thing two runs of one client are meant to differ in, and it is
      // written last because its presence is what marks the capture complete.
      writeDigest(path, [RECORD]);
      writeCaptureRecord(path, client, set, on, counts);
      const refused =
        held.refusals.length +
        said.refusals.length +
        stated.refusals.length +
        classed.refusals.length +
        drawn.refusals.length +
        read.refused;
      return `${path} — ${counted(held.inventory)} entries, ${lines(said.text)} texts, ${files(drawn.images)} images, ${read.written} curve tables, ${refused} refused`;
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
