import { join } from "node:path";
import { createCaptureDir, RECORD, writeCaptureRecord } from "./capture-dir";
import { readInstalledClient } from "./client";
import { writeDigest } from "./digest";
import { counted, INVENTORY, readInventory, writeInventory } from "./inventory";
import { formatShape, probe } from "./probe";
import { writeRefusals } from "./refusals";
import { readIdentifiers, writeIdentifiers } from "./identifier";
import { readTags, tagged, writeTags } from "./tags";
import { lines, readText, writeText } from "./text";
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
        ...read.refusals,
      ]);
      // The digest covers the reading; the record carries the moment, which is
      // the one thing two runs of one client are meant to differ in.
      writeDigest(path, [RECORD]);
      writeCaptureRecord(path, client, set, on, {
        curveTables: { read: read.written, refused: read.refused },
        inventory: {
          read: counted(held.inventory),
          refused: held.refusals.length,
        },
        identifiers: {
          read: Object.keys(stated.identifiers).length,
          refused: stated.refusals.length,
        },
        tags: { read: tagged(classed.tags), refused: classed.refusals.length },
        text: { read: lines(said.text), refused: said.refusals.length },
      });
      const refused =
        held.refusals.length +
        said.refusals.length +
        stated.refusals.length +
        classed.refusals.length +
        read.refused;
      return `${path} — ${counted(held.inventory)} entries, ${lines(said.text)} texts, ${read.written} curve tables, ${refused} refused`;
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
