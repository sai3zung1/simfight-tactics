import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";
import { readReader } from "./reader";
import type { Refusal } from "./refusals";

export const TAGS = join("entries", "tags.json");

export type Tags = Readonly<Record<string, readonly string[]>>;

export type TagsRead = {
  readonly tags: Tags;
  readonly refusals: readonly Refusal[];
};

export function parseTags(printed: string): Tags {
  const read: unknown = JSON.parse(printed);
  if (read === null || typeof read !== "object" || Array.isArray(read)) {
    throw new Error("the reader printed no tags at all");
  }

  for (const [entry, tags] of Object.entries(read)) {
    if (!Array.isArray(tags)) {
      throw new Error(`${entry} came back with tags that are not a list`);
    }
    for (const tag of tags as readonly unknown[]) {
      if (typeof tag !== "string" || !tag.includes(".")) {
        throw new Error(`${entry} carries ${String(tag)}, which is not a tag`);
      }
    }
  }
  return read as Tags;
}

export function readTags(client: InstalledClient, inventory: string): TagsRead {
  const said = readReader(client, ["tags", inventory]);
  return { tags: parseTags(said.printed), refusals: said.refusals };
}

export function writeTags(into: string, tags: Tags): void {
  writeJson(join(into, TAGS), tags);
}

export function tagged(tags: Tags): number {
  return Object.values(tags).reduce((total, held) => total + held.length, 0);
}
