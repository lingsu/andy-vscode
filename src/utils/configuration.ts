import * as vscode from "vscode";

export const getConfiguration = () => {
  return vscode.workspace.getConfiguration("andy");
};

export const getRemote = () => {
  return getConfiguration().get<string>(
    "remote",
    "https://github.com/lingsu/andy-vscode.git"
  );
};
