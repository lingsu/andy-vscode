import * as ejs from "ejs";
import * as fse from "fs-extra";
import * as path from "path";
import * as glob from "glob";
import * as prettier from "prettier";

export async function renderFile(templateFilepath: string, data: ejs.Data) {
  let content = await ejs.renderFile(templateFilepath, data);
  const targetFilePath = templateFilepath
    .replace(/\.ejs$/, "")
    .replace(
      /\$\{.+?\}/gi,
      (match) => data[match.replace(/\$|\{|\}/g, "")] || ""
    );
  try {
    content = await prettier.format(content, {
      singleQuote: true,
      filepath: targetFilePath,
    });
  } catch {}
  await fse.rename(templateFilepath, targetFilePath);
  await fse.writeFile(targetFilePath, content);
}

export async function renderTemplate(template: string, data: ejs.Data) {
  let content = await ejs.render(template, data);

  try {
    content = await prettier.format(content, {
      singleQuote: true,
    });
  } catch {}

  return content;
}
