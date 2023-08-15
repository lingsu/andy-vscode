// import * as path from 'path';
// import * as vscode from 'vscode';
// import * as fs from 'fs-extra';
// import {
//   blockMaterialsPath,
//   getEnv,
//   rootPath,
// } from './vscodeEnv';
// import { getOutputChannel } from './outputChannel';

// export const genCodeBySnippet = async (data: {
//     model: any;
//     template: string;
//     name: string;
//     privateMaterials?: boolean;
//   }) => {
//     const snippetPath = path.join(
//       data.privateMaterials
//         ? getPrivateSnippetMaterialsPath()
//         : snippetMaterialsPath,
//       data.name,
//     );
//     const scriptFile = path.join(snippetPath, 'script/index.js');
//     const hook = {
//       beforeCompile: (context: any) =>
//         <object | undefined>Promise.resolve(undefined),
//       afterCompile: (context: any) => <any>Promise.resolve(undefined),
//     };
//     if (fs.existsSync(scriptFile)) {
//       delete eval('require').cache[eval('require').resolve(scriptFile)];
//       const script = eval('require')(scriptFile);
//       if (script.beforeCompile) {
//         hook.beforeCompile = script.beforeCompile;
//       }
//       if (script.afterCompile) {
//         hook.afterCompile = script.afterCompile;
//       }
//     }
//     const activeTextEditor = getLastAcitveTextEditor();
//     if (activeTextEditor) {
//       data.model = {
//         ...data.model,
//         activeTextEditorFilePath: activeTextEditor.document.uri.fsPath.replace(
//           /\\/g,
//           '/',
//         ),
//       };
//     }
//     const context = {
//       model: data.model,
//       vscode,
//       workspaceRootPath: rootPath,
//       env: getEnv(),
//       libs: getInnerLibs(),
//       outputChannel: getOutputChannel(),
//       log: getOutputChannel(),
//       createChatCompletion: createChatCompletionForScript,
//       code: '',
//     };
//     const extendModel = await hook.beforeCompile(context);
//     if (extendModel) {
//       data.model = {
//         ...data.model,
//         ...extendModel,
//       };
//     }
//     const code = compile(data.template, data.model);
//     context.code = code;
//     const newCode = await hook.afterCompile(context);
//     pasteToEditor(newCode || code);
//   };
  