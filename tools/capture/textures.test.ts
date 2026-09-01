import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { files, INDEX, parseImages, writeImageIndex } from "./textures";

const SQUARE = {
  entry: "DA_18_Ahri",
  file: "T_18_Ahri_Square.png",
  format: "PF_DXT1",
  height: 128,
  width: 128,
};

const SPLASH = {
  ...SQUARE,
  file: "T_18_Ahri_TeamPlanner_Splash.png",
  height: 256,
  width: 256,
};

function printed(value: unknown): string {
  return JSON.stringify(value);
}

test("reads an image with the entry that named it", () => {
  expect(parseImages(printed([SQUARE]))).toEqual([SQUARE]);
});

test("keeps every artwork an entry names, and designates none", () => {
  expect(parseImages(printed([SQUARE, SPLASH]))).toHaveLength(2);
});

test("counts one file that two entries share once", () => {
  const shared = { ...SQUARE, entry: "DA_18_Akali_AP" };
  expect(files([SQUARE, shared, SPLASH])).toBe(2);
});

test("refuses an image with no file", () => {
  expect(() => parseImages(printed([{ ...SQUARE, file: "" }]))).toThrow(
    "missing an entry, a file or a format",
  );
});

test("refuses an image that opens at nothing", () => {
  expect(() => parseImages(printed([{ ...SQUARE, width: 0 }]))).toThrow(
    "opens at 0 by 128",
  );
});

test("refuses something that is not a list of images", () => {
  expect(() => parseImages("{}")).toThrow("no images at all");
});

test("writes the index into the capture, under assets", () => {
  const where = mkdtempSync(join(tmpdir(), "sft-assets-"));
  writeImageIndex(where, [SQUARE]);
  expect(JSON.parse(readFileSync(join(where, INDEX), "utf8"))).toEqual([
    SQUARE,
  ]);
});
