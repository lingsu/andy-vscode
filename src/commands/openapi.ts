import * as vscode from "vscode";
import * as copyPaste from "copy-paste";
import * as path from "path";

import * as fs from "fs-extra";
// import  * as glob from "glob";
import { glob } from "glob";
import * as recast from "recast";
import * as ts from "typescript";
import { Project, StructureKind } from "ts-morph";
import type {
  ContentObject,
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from "openapi3-ts/oas30";
import { getEnv, materialsPath, rootPath, tempWorkPath } from "../utils/vscodeEnv";
import { getFileContent, writeFile } from "../utils/file";
import { download } from "../utils/download";
import * as _ from "lodash";
import * as prettier from "prettier";
import { generateService } from "@umijs/openapi";
import { renderTemplate } from "../utils/ejs";
import { getOutputChannel } from "../utils/outputChannel";
// import converter from 'swagger2openapi';

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
      const requestLibPath = "";

      const config = {
        namespace: "API",
        // requestImportStatement,
        enumStyle: "string-literal",
        projectName: "blade",
        serversPath: path.join(rootPath,"src","service"),
        // templatesFolder: path.join(materialsPath, "openapi")
        templatesFolder: path.join(context.extensionPath,"materials","blocks", "openapi")
        // nullable,
        // ...rest,
      };

      try {
        var openAPIData = await getOpenAPIConfig(
          "http://petstore.swagger.io/v2/swagger.json"
        );
        console.log("openAPIData", openAPIData);

        const serviceGenerator = new ServiceGenerator(config, openAPIData);

        serviceGenerator.genFile();
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
