import * as vscode from "vscode";
import * as path from "path";

import { rootPath, tempWorkPath } from "../utils/vscodeEnv";
import { getFileContent } from "../utils/file";
import { download } from "../utils/download";
import * as _ from "lodash";

import Log from "../utils/log";
import { ServiceGenerator } from "../utils/openapi/serviceGenerator";

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

export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-tool.openapi",
    async () => {

      const config = {
        namespace: "API",
        // requestImportStatement,
        enumStyle: "string-literal",
        projectName: "blade",
        serversPath: path.join(rootPath,"src","service"),
        // templatesFolder: path.join(materialsPath, "openapi")
        templatesFolder: path.join(context.extensionPath,"materials","blocks", "openapi"),
        requestImportStatement:`import request from "../../utils/request";`,
        dataFields:['result', 'res',"data","records"],
        // nullable,
        // ...rest,
      };

      try {
        var openAPIData = await getOpenAPIConfig(
          // "http://petstore.swagger.io/v2/swagger.json"
          "https://hatching.ouhaihr.com/api/v2/api-docs?group=%E6%B2%BB%E7%90%86%E6%A8%A1%E5%9D%97"
        );
        console.log("openAPIData", openAPIData);

        const serviceGenerator = new ServiceGenerator(config, openAPIData);

        await serviceGenerator.genFile();
      } catch (error) {
        console.log("error", error);
      }

      // generateService({
      //   schemaPath: "http://petstore.swagger.io/v2/swagger.json",
      //   serversPath: path.join(rootPath, "src", "servers"),
      // });
    }
  );
  context.subscriptions.push(disposable);
};
