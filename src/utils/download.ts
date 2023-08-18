import * as path from "path";
import * as fs from "fs-extra";
import { execa } from "execa";
import { tempDir } from "./vscodeEnv";

export const downloadMaterialsFromGit = async (remote: string) => {
  await fs.ensureDir(tempDir.temp);
  await fs.remove(tempDir.materials);
  await execa("git", ["clone", ...remote.split(" "), tempDir.materials]);
};
