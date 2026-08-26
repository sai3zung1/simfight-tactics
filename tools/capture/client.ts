import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

export type InstalledClient = {
  readonly root: string;
  readonly paks: string;
  readonly branch: string;
  readonly build: string;
};

export function readInstalledClient(installRoot: string): InstalledClient {
  const paks = join(installRoot, "TFT", "Content", "Paks");
  if (!existsSync(paks)) {
    throw new Error(`no container folder at ${paks}`);
  }

  const marker = join(installRoot, "Engine", "Build", "Build.version");
  if (!existsSync(marker)) {
    throw new Error(`no build marker at ${marker}`);
  }

  const version = JSON.parse(readFileSync(marker, "utf8")) as {
    BranchName?: string;
  };
  if (!version.BranchName) {
    throw new Error(`no BranchName in ${marker}`);
  }

  return {
    root: installRoot,
    paks,
    branch: basename(installRoot),
    build: version.BranchName,
  };
}
