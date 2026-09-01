import { join } from "node:path";
import type { InstalledClient } from "./client";
import { writeJson } from "./digest";
import { readReader } from "./reader";
import type { Refusal } from "./refusals";

export const ASSETS = "assets";
export const INDEX = join(ASSETS, "index.json");

export type CapturedImage = {
  readonly entry: string;
  readonly file: string;
  readonly format: string;
  readonly height: number;
  readonly width: number;
};

export type TexturesRead = {
  readonly images: readonly CapturedImage[];
  readonly refusals: readonly Refusal[];
};

export function parseImages(printed: string): readonly CapturedImage[] {
  const read: unknown = JSON.parse(printed);
  if (!Array.isArray(read)) {
    throw new Error("the reader printed no images at all");
  }

  for (const image of read as readonly CapturedImage[]) {
    if (!image.entry || !image.file || !image.format) {
      throw new Error("an image is missing an entry, a file or a format");
    }
    if (!(image.width > 0) || !(image.height > 0)) {
      throw new Error(
        `${image.file} opens at ${image.width} by ${image.height}`,
      );
    }
  }
  return read as readonly CapturedImage[];
}

export function readTextures(
  client: InstalledClient,
  inventory: string,
  into: string,
): TexturesRead {
  const said = readReader(client, ["textures", inventory, join(into, ASSETS)]);
  return { images: parseImages(said.printed), refusals: said.refusals };
}

export function writeImageIndex(
  into: string,
  images: readonly CapturedImage[],
): void {
  writeJson(join(into, INDEX), images);
}

// One file can stand under several entries: the client shares art on purpose.
export function files(images: readonly CapturedImage[]): number {
  return new Set(images.map((image) => image.file)).size;
}
