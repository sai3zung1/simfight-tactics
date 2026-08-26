import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { InstalledClient } from "./client";

const TOC_MAGIC = "-==--==--==--==-";

const CONTAINER_FLAGS = [
  [1, "compressed"],
  [2, "encrypted"],
  [4, "signed"],
  [8, "indexed"],
  [16, "on-demand"],
] as const;

export type ContainerFlag = (typeof CONTAINER_FLAGS)[number][1];

export type ContainerShape = {
  readonly file: string;
  readonly tocVersion: number;
  readonly chunks: number;
  readonly compression: readonly string[];
  readonly flags: readonly ContainerFlag[];
  readonly encrypted: boolean;
};

export type ClientShape = {
  readonly branch: string;
  readonly build: string;
  readonly containers: readonly ContainerShape[];
};

export function readContainerShape(
  file: string,
  bytes: Uint8Array,
): ContainerShape {
  const magic = new TextDecoder().decode(bytes.subarray(0, 16));
  if (magic !== TOC_MAGIC) {
    throw new Error(`${file} does not start with an IoStore table of contents`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = view.getUint32(20, true);
  const chunks = view.getUint32(24, true);
  const blocks = view.getUint32(28, true);
  const blockSize = view.getUint32(32, true);
  const methodCount = view.getUint32(36, true);
  const methodLength = view.getUint32(40, true);
  const flagBits = bytes[80] ?? 0;
  const perfectHashSeeds = view.getUint32(84, true);
  const chunksWithoutPerfectHash = view.getUint32(96, true);

  // The method names are the last table in the file, so their offset is the sum
  // of everything ahead of them: one entry per chunk in each of the id and
  // offset tables, one slot per hash seed and per unhashed chunk, then the
  // compression blocks. Miss a term and the names read as noise rather than
  // failing.
  const namesAt =
    headerSize +
    chunks * 12 +
    chunks * 10 +
    perfectHashSeeds * 4 +
    chunksWithoutPerfectHash * 4 +
    blocks * blockSize;

  const compression: string[] = [];
  for (let i = 0; i < methodCount; i++) {
    const at = namesAt + i * methodLength;
    const name = new TextDecoder()
      .decode(bytes.subarray(at, at + methodLength))
      .replace(/\0+$/, "");
    if (name) compression.push(name);
  }

  const flags = CONTAINER_FLAGS.filter(([bit]) => flagBits & bit).map(
    ([, name]) => name,
  );

  return {
    file,
    tocVersion: bytes[16] ?? 0,
    chunks,
    compression,
    flags,
    encrypted: flags.includes("encrypted"),
  };
}

export function probe(client: InstalledClient): ClientShape {
  const names = [...new Bun.Glob("*.utoc").scanSync({ cwd: client.paks })];
  names.sort();
  if (names.length === 0) {
    throw new Error(`no container index under ${client.paks}`);
  }

  return {
    branch: client.branch,
    build: client.build,
    containers: names.map((name) =>
      readContainerShape(name, readFileSync(join(client.paks, name))),
    ),
  };
}

export function formatShape(shape: ClientShape): string {
  const lines = [`${shape.branch} — ${shape.build}`];
  for (const c of shape.containers) {
    lines.push(
      `  ${c.file}` +
        `\n    toc ${c.tocVersion} · ${c.chunks} chunks` +
        `\n    compression ${c.compression.length ? c.compression.join(", ") : "none"}` +
        `\n    flags ${c.flags.length ? c.flags.join(", ") : "none"}` +
        `\n    encrypted ${c.encrypted}`,
    );
  }
  return lines.join("\n");
}
