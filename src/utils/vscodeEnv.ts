import * as vscode from "vscode";
import * as copyPaste from "copy-paste";
import * as path from "path";
import * as fs from "fs-extra";
import * as os from 'os';

export const rootPath = path.join(
  vscode.workspace.workspaceFolders![0].uri.fsPath || ""
);

export const tempWorkPath = path.join(rootPath, '.andy');

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


export const commands = {
  openDownloadMaterials: 'andy.openDownloadMaterials',
};

export const materialsDir = 'materials';

export const tempDir = {
  temp: path.join(os.homedir(), '.andy'),
  materials: path.join(os.homedir(), '.andy', 'materials'),
  blockMaterials: path.join(
    os.homedir(),
    '.andy',
    'materials',
    materialsDir,
    'blocks',
  ),
  snippetMaterials: path.join(
    os.homedir(),
    '.andy',
    'materials',
    materialsDir,
    'snippets',
  ),
  scaffold: path.join(os.homedir(), '.andy', 'scaffold'),
};
