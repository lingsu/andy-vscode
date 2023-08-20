import * as vscode from "vscode";
import * as copyPaste from "copy-paste";
import * as path from "path";

import * as fs from "fs-extra";
// import  * as glob from "glob";
import { glob } from "glob";
import * as recast from "recast";
import * as ts from "typescript";
import { Project, StructureKind } from "ts-morph";

import { getEnv, rootPath } from "../utils/vscodeEnv";
import { getFileContent, writeFile } from "../utils/file";
import * as _ from "lodash";
import * as prettier from "prettier";
import { generateService } from "@umijs/openapi";
import { renderTemplate } from "../utils/ejs";
import { getOutputChannel } from "../utils/outputChannel";

export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-tool.openapi",
    async () => {
      generateService({
        schemaPath: "http://petstore.swagger.io/v2/swagger.json",
        serversPath: path.join(rootPath, "src", "servers"),
      });
    }
  );
  context.subscriptions.push(disposable);
};
