import { Range, SnippetString, window } from 'vscode';
import { getLastAcitveTextEditor } from './context';

export const pasteToEditor = (content: string, isInsertSnippet = true) => {
    // vscode 本身代码片段语法
    if (isInsertSnippet) {
      return insertSnippet(content);
    }
    const activeTextEditor = getLastAcitveTextEditor();
    if (activeTextEditor === undefined) {
      throw new Error('无打开文件');
    }
    return activeTextEditor?.edit((editBuilder) => {
      // editBuilder.replace(activeTextEditor.selection, content);
      if (activeTextEditor.selection.isEmpty) {
        editBuilder.insert(activeTextEditor.selection.start, content);
      } else {
        editBuilder.replace(
          new Range(
            activeTextEditor.selection.start,
            activeTextEditor.selection.end,
          ),
          content,
        );
      }
    });
  };
  
  export const insertSnippet = (content: string) => {
    const activeTextEditor = window.activeTextEditor || getLastAcitveTextEditor();
    if (activeTextEditor === undefined) {
      throw new Error('无打开文件');
    }
    return activeTextEditor.insertSnippet(new SnippetString(content));
  };