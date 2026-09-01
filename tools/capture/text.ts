import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";
import { readReader } from "./reader";
import type { Refusal } from "./refusals";

// Forward slashes: a path inside a capture is what `digest.json` keys on, and
// it is the same string on every machine. `join` still resolves it for writing.
export const TEXT = "entries/text.json";

export type EntryText = {
  readonly component: string;
  readonly key: string;
  readonly source: string;
};

export type Text = Readonly<Record<string, readonly EntryText[]>>;

export type TextRead = {
  readonly text: Text;
  readonly refusals: readonly Refusal[];
};

export function parseText(printed: string): Text {
  const read: unknown = JSON.parse(printed);
  if (read === null || typeof read !== "object" || Array.isArray(read)) {
    throw new Error("the reader printed no text at all");
  }

  const text: Record<string, readonly EntryText[]> = {};
  for (const [entry, lines] of Object.entries(read)) {
    if (!Array.isArray(lines) || lines.length === 0) {
      // An entry with no text is a refusal, and a refusal does not come back
      // here as an empty list.
      throw new Error(`${entry} came back with no text`);
    }

    for (const line of lines as readonly EntryText[]) {
      if (!line.component || !line.key || !line.source) {
        throw new Error(
          `${entry} holds a text missing a component, a key or a source`,
        );
      }
    }
    text[entry] = lines as readonly EntryText[];
  }
  return text;
}

export function readText(client: InstalledClient, inventory: string): TextRead {
  const said = readReader(client, ["text", inventory]);
  return { text: parseText(said.printed), refusals: said.refusals };
}

export function writeText(into: string, text: Text): void {
  writeJson(join(into, TEXT), text);
}

export function lines(text: Text): number {
  return Object.values(text).reduce((total, held) => total + held.length, 0);
}
