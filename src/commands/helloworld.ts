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

import { renderTemplate } from "../utils/ejs";
import { getOutputChannel } from "../utils/outputChannel";
import { getRemote } from "../utils/configuration";
import { downloadMaterialsFromGit } from "../utils/download";
const channel = getOutputChannel();

export default (context: vscode.ExtensionContext) => {
    let disposable = vscode.commands.registerCommand(
      "andy-tool.helloworld",
      async () => {
        console.log("workspaceFolders", vscode.workspace.workspaceFolders);
        console.log("workspaceFile", vscode.workspace.workspaceFile);
        console.log("rootPath", vscode.workspace.rootPath);
        console.log("appRoot", vscode.env.appRoot);
        console.log("extensionPath", context.extensionPath);
  
        channel.show();
  
        const remote = getRemote();
        channel.appendLine(`开始下载模板：${remote}`);
        await downloadMaterialsFromGit(
          remote
        );
        channel.appendLine("模板下载完成");
  
  
        var editor = vscode.window.activeTextEditor;
        if (editor) {
          // editor.document.
        }
      }
    );
    context.subscriptions.push(disposable);
  };
  