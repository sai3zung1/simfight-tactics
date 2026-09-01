import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";
import { readReader } from "./reader";
import type { Refusal } from "./refusals";

export const IDENTIFIERS = join("entries", "identifiers.json");

export type Identifiers = Readonly<Record<string, string>>;

export type IdentifierRead = {
  readonly identifiers: Identifiers;
  readonly refusals: readonly Refusal[];
};

export function parseIdentifiers(printed: string): Identifiers {
  const read: unknown = JSON.parse(printed);
  if (read === null || typeof read !== "object" || Array.isArray(read)) {
    throw new Error("the reader printed no identifiers at all");
  }

  const stated = new Map<string, string>();
  for (const [entry, identifier] of Object.entries(read)) {
    if (typeof identifier !== "string" || identifier.length === 0) {
      throw new Error(`${entry} came back with an identifier that is not one`);
    }
    const already = stated.get(identifier);
    if (already !== undefined) {
      // A join key that repeats joins the wrong rows.
      throw new Error(`${entry} and ${already} both state ${identifier}`);
    }
    stated.set(identifier, entry);
  }
  return read as Identifiers;
}

export function readIdentifiers(
  client: InstalledClient,
  inventory: string,
): IdentifierRead {
  const said = readReader(client, ["identifiers", inventory]);
  return {
    identifiers: parseIdentifiers(said.printed),
    refusals: said.refusals,
  };
}

export function writeIdentifiers(into: string, identifiers: Identifiers): void {
  writeJson(join(into, IDENTIFIERS), identifiers);
}
