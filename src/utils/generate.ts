import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs-extra";
import { getFileContent, writeFile } from "./file";
import { compile } from "./ejs";
import { getLastAcitveTextEditor } from "./context";
import { pasteToEditor } from "./editor";
// import {
//   blockMaterialsPath,
//   getEnv,
//   rootPath,
// } from './vscodeEnv';
// import { getOutputChannel } from './outputChannel';

export const genCodeBySnippet = async (model: any, tempWorkPath: string) => {
  // const hook = {
  //   beforeCompile: (context: any) =>
  //     <object | undefined>Promise.resolve(undefined),
  //   afterCompile: (context: any) => <any>Promise.resolve(undefined),
  // };

  // const activeTextEditor = getLastAcitveTextEditor();
  // if (activeTextEditor) {
  //   data.model = {
  //     ...data.model,
  //     activeTextEditorFilePath: activeTextEditor.document.uri.fsPath.replace(
  //       /\\/g,
  //       '/',
  //     ),
  //   };
  // }

  // const extendModel = await hook.beforeCompile(context);
  // if (extendModel) {
  //   data.model = {
  //     ...data.model,
  //     ...extendModel,
  //   };
  // }
  const template = getFileContent(tempWorkPath, true);

  const code = compile(template, model);

  // const code = compile(data.template, data.model);
  return pasteToEditor(code);
};

export const genCodeByFile = async (
  model: any,
  tempWorkPath: string,
  createPath: string
) => {
  const template = getFileContent(tempWorkPath, true);

  const code = compile(template, model);
  await writeFile(code, createPath);
};
