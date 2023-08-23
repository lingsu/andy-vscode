import * as vscode from "vscode";
import * as path from "path";

import * as fs from "fs-extra";
import { tempWorkPath } from "../utils/vscodeEnv";
import * as _ from "lodash";

import { getConfig, saveConfig } from "../utils/config";
import { writeFile } from "../utils/file";

export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-tool.initconfig",
    async () => {
      fs.ensureDir(tempWorkPath).then(async () => {
        var exists = await fs.exists(path.join(tempWorkPath, ".gitignore"));
        if (exists === false) {
          await writeFile(path.join(tempWorkPath, ".gitignore"), `*`);
        }
      });

      saveConfig(getConfig());
    }
  );
  context.subscriptions.push(disposable);
};
