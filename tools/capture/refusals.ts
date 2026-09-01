import { join } from "node:path";
import { writeJson } from "./digest";

export const REFUSALS = "refusals.json";

export type Refusal = {
  readonly path: string;
  readonly reading: string;
  readonly reason: string;
};

// The reader writes one `path<TAB>reason` line per refusal to stderr. Anything
// else on that stream after a successful run is not a refusal anybody made, so
// it is a fault rather than a row.
export function readRefusals(
  said: string,
  reading: string,
): readonly Refusal[] {
  return said
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
      const [path, reason, ...rest] = line.split("\t");
      if (!path || !reason || rest.length > 0) {
        throw new Error(`the reader said ${line}, which is not a refusal`);
      }
      return { path, reading, reason };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

// Written even when nothing was refused: an empty list says the run refused
// nothing, where an absent file would leave the question open.
export function writeRefusals(
  into: string,
  refusals: readonly Refusal[],
): void {
  writeJson(join(into, REFUSALS), refusals);
}
