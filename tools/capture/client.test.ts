import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readInstalledClient } from "./client";

function installAt(branch: string, version: object | null): string {
  const root = join(mkdtempSync(join(tmpdir(), "sft-")), branch);
  mkdirSync(join(root, "TFT", "Content", "Paks"), { recursive: true });
  if (version) {
    mkdirSync(join(root, "Engine", "Build"), { recursive: true });
    writeFileSync(
      join(root, "Engine", "Build", "Build.version"),
      JSON.stringify(version),
    );
  }
  return root;
}

test("refuses a path holding no container folder", () => {
  expect(() => readInstalledClient(join(tmpdir(), "sft-absent"))).toThrow(
    "Paks",
  );
});

test("refuses an install with no build marker", () => {
  expect(() => readInstalledClient(installAt("PBE", null))).toThrow(
    "Build.version",
  );
});

test("refuses a build marker naming no branch", () => {
  expect(() =>
    readInstalledClient(installAt("PBE", { Changelist: 1 })),
  ).toThrow("BranchName");
});

test("takes the branch from the install folder and the build from the marker", () => {
  const client = readInstalledClient(
    installAt("Live", { BranchName: "++tft+rls-18.1.0" }),
  );
  expect(client.branch).toBe("Live");
  expect(client.build).toBe("++tft+rls-18.1.0");
  expect(client.paks.endsWith(join("TFT", "Content", "Paks"))).toBe(true);
});
