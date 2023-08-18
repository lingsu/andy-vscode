// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// import * as copyPaste from "copy-paste";
import * as fs from "fs-extra";
import * as path from "path";
import reactrouter from "./commands/reactrouter";
import { tempWorkPath } from "./utils/vscodeEnv";
import { downloadMaterialsFromGit } from "./utils/download";
import { getOutputChannel } from "./utils/outputChannel";
import { getRemote } from "./utils/configuration";

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

  fs.ensureDir(tempWorkPath).then(async () => {
    var exists = await fs.exists(path.join(tempWorkPath, ".gitignore"));
    if (exists === false) {
      await fs.writeFile(path.join(tempWorkPath, ".gitignore"), `*`);
    }
  });

  let disposable = vscode.commands.registerCommand(
    "andy-tool.helloWorld",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user

      // try {
      //   const rawClipboardText = await copyPaste.paste();
      //   let clipboardText = rawClipboardText.trim();

      //   vscode.window.showInformationMessage(
      //     "Hello World from andy vscode!" + clipboardText
      //   );
      // } catch (error) {
      //   console.log(error);
      // }

      // vscode.window.showInformationMessage('Hello World from andy vscode!' );

      // vscode.window.activeTextEditor?.insertSnippet(
      //   new vscode.SnippetString("test abc")
      // );
      // vscode

      // console.log("clipboard" , await vscode.env.clipboard.readText());
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
  reactrouter(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
