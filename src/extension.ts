// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import reactrouter from "./commands/reactrouter";
import { tempWorkPath } from "./utils/vscodeEnv";
import { downloadMaterialsFromGit } from "./utils/download";
import { getOutputChannel } from "./utils/outputChannel";
import { getRemote } from "./utils/configuration";
import openapi from "./commands/openapi";
import helloworld from "./commands/helloworld";
import initConfig from "./commands/initConfig";

const channel = getOutputChannel();

// export const rootPath = path.join(
//   vscode.workspace.workspaceFolders![0].uri.fsPath || ""
// );

// export const tempWorkPath = path.join(rootPath, ".andy_temp");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "andy-tool" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

 
 
  initConfig(context);
  helloworld(context);
  reactrouter(context);
  openapi(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
