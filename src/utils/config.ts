import * as path from "path";
import * as fs from "fs-extra";
import { getFileContent } from "./file";
import { rootPath } from "./vscodeEnv";
import { GenerateServiceProps } from "./openapi/typing";

const defaultConfig: Config = {
  openApi: [
    {
      schemaPath: "",
      namespace: "API",
      // requestImportStatement,
      enumStyle: "string-literal",
      projectName: "blade",
      serversPath: "./src/service",
      // templatesFolder: path.join(materialsPath, "openapi")
      // templatesFolder: path.join(context.extensionPath,"materials","blocks", "openapi"),
      requestImportStatement: `import request from "../../utils/request";`,
      dataFields: ["result", "res", "data", "records"],
    },
  ],
};

export type Config = {
  openApi?: GenerateServiceProps[];
};

export const getConfig: () => Config = () => {
  let config: Config;
  if (fs.existsSync(path.join(rootPath, ".andy.json"))) {
    config = JSON.parse(getFileContent(".andy.json") || "{}");
    // config.yapi?.projects?.forEach((s) => {
    //   s.domain = s.domain || config.yapi?.domain || "";
    // });
  } else {
    config = getAllConfig();
  }
  return { ...defaultConfig, ...config };
};

export const saveConfig = (config: Config) => {
  fs.writeFileSync(
    path.join(rootPath, ".andy.json"),
    JSON.stringify(config, null, 2)
  );
};

/**
 * 获取模板文件路径，默认为 codeTemplate 目录下
 *
 * @returns
 */
export const getTemplateFilePath = () => "codeTemplate";

const getAllConfig: () => Config = () => {
  return {
    // yapi: {
    //   domain: getDomain(),
    //   projects: getProjectList(),
    // },
    // commonlyUsedBlock: getCommonlyUsedBlock(),
  };
};
