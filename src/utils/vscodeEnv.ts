import * as vscode from "vscode";
import * as copyPaste from "copy-paste";
import * as path from "path";
import * as fs from "fs-extra";

export const rootPath = path.join(
  vscode.workspace.workspaceFolders![0].uri.fsPath || ""
);
export const materialsPath = path.join(rootPath, 'materials');

export const blockMaterialsPath = path.join(materialsPath, 'blocks');

// export const getPrivateSnippetMaterialsPath = () => {
//   const syncFolder = getSyncFolder();
//   if (!syncFolder) {
//     return '';
//   }
//   return path.join(syncFolder, 'materials', 'snippets');
// };
export const getEnv = () => ({
  rootPath,
});
