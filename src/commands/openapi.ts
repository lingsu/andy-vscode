import * as vscode from "vscode";
import * as path from "path";

import { rootPath, tempWorkPath } from "../utils/vscodeEnv";
import { getFileContent, writeFile } from "../utils/file";
import { download } from "../utils/download";
import * as _ from "lodash";

import Log from "../utils/log";
import { ServiceGenerator } from "../utils/openapi/serviceGenerator";
import { GenerateServiceProps } from "../utils/openapi/typing";
import { getConfig } from "../utils/config";

const converterSwaggerToOpenApi = (swagger: any) => {
  console.log("swagger", swagger);
  if (!swagger.swagger) {
    return swagger;
  }
  return new Promise((resolve, reject) => {
    const converter = require("swagger2openapi");

    converter.convertObj(swagger, {}, (err: any, options: any) => {
      Log(["💺 将 Swagger 转化为 openAPI"]);
      if (err) {
        reject(err);
        return;
      }
      resolve(options.openapi);
    });
  });
};
const getOpenAPIConfig = async (schemaPath: string) => {
  const schema = await getSchema(schemaPath);
  if (!schema) {
    return null;
  }
  const openAPI = await converterSwaggerToOpenApi(schema);

  return openAPI;
};
const getSchema = async (schemaPath: string) => {
  await download(schemaPath, tempWorkPath, "swagger.json");
  return JSON.parse(
    getFileContent(path.join(tempWorkPath, "swagger.json"), true) || "{}"
  );
};

const run = async (config: GenerateServiceProps) => {
  config = {
    namespace: "API",
    // requestImportStatement,
    enumStyle: "string-literal",
    projectName: "blade",
    ...config,
    serversPath: path.join(rootPath, config.serversPath!),

    // templatesFolder: path.join(materialsPath, "openapi")
    // nullable,
    // ...rest,
  };

  try {
    var openAPIData = await getOpenAPIConfig(
      // "http://petstore.swagger.io/v2/swagger.json"
      config.schemaPath!
    );
    console.log("openAPIData", openAPIData);
    await writeFile(
      JSON.stringify(openAPIData),
      path.join(tempWorkPath, "openAPIData.json")
    );

    const serviceGenerator = new ServiceGenerator(config, openAPIData);

    await serviceGenerator.genFile();

    vscode.window.showInformationMessage("生成完成");
  } catch (error: any) {
    Log(error.message)
    vscode.window.showErrorMessage(error.message);
    // Log(``+error)
  }
};
export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-tool.openapi",
    async () => {
      var config = getConfig();
      var openApi = config.openApi || [];
      if (openApi.length < 1) {
        vscode.window.showWarningMessage('未配置OpenApi', {
          modal: true,
        });
        return;
      }
      var projectName : undefined | string = '';
      if (openApi.length > 1) {
        projectName = await vscode.window.showQuickPick(openApi.map(x=>x.projectName!), {
          placeHolder: '请选择OpenApi',
        });
        if (!projectName) {
          return;
        }
      }else{
        projectName = openApi[0].projectName;
      }

      await run({
        ...openApi.find(x=>x.projectName == projectName),
        templatesFolder: path.join(
          context.extensionPath,
          "materials",
          "blocks",
          "openapi"
        ),
      });

      // generateService({
      //   schemaPath: "http://petstore.swagger.io/v2/swagger.json",
      //   serversPath: path.join(rootPath, "src", "servers"),
      // });
    }
  );
  context.subscriptions.push(disposable);
};
