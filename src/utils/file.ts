import * as path from "path";
import * as fs from "fs";
import * as prettier from "prettier";
import { rootPath } from "./vscodeEnv";

export const getFileContent = (filePath: string, fullPath = false) => {
  let fileContent = "";
  const fileFullPath = fullPath ? filePath : path.join(rootPath, filePath);
  try {
    const fileBuffer = fs.readFileSync(fileFullPath);
    fileContent = fileBuffer.toString();
  } catch (error) {
    console.log('getFileContent error', error)
  }
  return fileContent;
};

// export function getPageDirs(PageOptions: PageOptions, root: string, exclude: string[]): PageOptions[] {
//   const dirs = fg.sync(slash(PageOptions.dir), {
//     ignore: exclude,
//     onlyDirectories: true,
//     dot: true,
//     unique: true,
//     cwd: root,
//   })

//   const pageDirs = dirs.map(dir => ({
//     ...PageOptions,
//     dir,
//   }))

//   return pageDirs
// }

// /**
//  * Resolves the files that are valid pages for the given context.
//  */
// export function getPageFiles(path: string, options: ResolvedOptions, pageOptions?: PageOptions): string[] {
//   const {
//     exclude,
//     extensions,
//   } = options

//   const ext = extsToGlob(extensions)
//   const pattern = (pageOptions?.filePatern || pageOptions?.filePattern) ?? `**/*.${ext}`

//   const files = fg.sync(pattern, {
//     ignore: exclude,
//     onlyFiles: true,
//     cwd: path,
//   }).map(p => slash(join(path, p)))

//   return files
// }

export async function writeFile(content: string, targetFilePath: string) {
  fs.writeFileSync(targetFilePath, content);

  try {
    content = await prettier.format(content, {
      singleQuote: true,
      filepath: targetFilePath,
    });
    fs.writeFileSync(targetFilePath, content);
  } catch (error) {
    console.log("prettier error", error);
  }
}
