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
import { getEnv, rootPath, tempWorkPath } from "../utils/vscodeEnv";
import { getFileContent, writeFile } from "../utils/file";
import { download } from "../utils/download";
import * as _ from "lodash";
import * as prettier from "prettier";
import { generateService } from "@umijs/openapi";
import { renderTemplate } from "../utils/ejs";
import { getOutputChannel } from "../utils/outputChannel";
// import converter from 'swagger2openapi';

import Log from "../utils/log";

type APIDataType = OperationObject & {
  path: string;
  method: string;
};
type Config = {
  requestLibPath?: string;
  requestImportStatement?: string;
  /**
   * api 的前缀
   */
  apiPrefix?:
    | string
    | ((params: {
        path: string;
        method: string;
        namespace: string;
        functionName: string;
        autoExclude?: boolean;
      }) => string);
  /**
   * 生成的文件夹的路径
   */
  serversPath?: string;
  /**
   * Swagger 2.0 或 OpenAPI 3.0 的地址
   */
  schemaPath?: string;
  /**
   * 项目名称
   */
  projectName: string;

  hook?: {
    /** 自定义函数名称 */
    customFunctionName?: (data: OperationObject) => string;
    /** 自定义类型名称 */
    customTypeName?: (data: OperationObject) => string;
    /** 自定义类名 */
    customClassName?: (tagName: string) => string;
  };
  namespace?: string;

  /**
   * 默认为false，true时使用null代替可选
   */
  nullable?: boolean;

  mockFolder?: string;
  /**
   * 模板文件的文件路径
   */
  templatesFolder?: string;

  /**
   * 枚举样式
   */
  enumStyle?: "string-literal" | "enum";

  /**
   * response中数据字段
   * example: ['result', 'res']
   */
  dataFields?: string[];
};
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

const genApiData = (openAPIData: any, basePath: string) => {
  const apiData: Record<string, APIDataType[]> = {};

  Object.keys(openAPIData.paths || {}).forEach((p) => {
    const pathItem: PathItemObject = openAPIData.paths[p];

    ["get", "put", "post", "delete", "patch"].forEach((method) => {
      const operationObject: OperationObject = pathItem[method as any];
      if (!operationObject) {
        return;
      }

      // const tags = pathItem['x-swagger-router-controller']
      //   ? [pathItem['x-swagger-router-controller']]
      //   : operationObject.tags || [operationObject.operationId] || [
      //       p.replace('/', '').split('/')[1],
      //     ];

      const tags = operationObject["x-swagger-router-controller"]
        ? [operationObject["x-swagger-router-controller"]]
        : operationObject.tags || [operationObject.operationId] || [
            p.replace("/", "").split("/")[1],
          ];

      tags.forEach((tagString) => {
        console.log("tagString", tagString);
        // const tag = resolveTypeName(tagString);
        const tag = tagString;

        if (!apiData[tag]) {
          apiData[tag] = [];
        }
        apiData[tag].push({
          path: `${basePath}${p}`,
          method,
          ...operationObject,
        });
      });
    });
  });

  return apiData;
};

const genFile = (
  apiData: Record<string, APIDataType[]>,
  basePath: string,
  config: Config
) => {
  basePath = basePath || "./src/service";
  const finalPath = path.join(rootPath, basePath, config.projectName);
  console.log('finalPath',finalPath)

  const genFileFromTemplate = () => {
    
  }



};
export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-tool.openapi",
    async () => {
      const requestLibPath = "";


      const config =   {
        namespace: 'API',
        // requestImportStatement,
        enumStyle: 'string-literal',
        projectName:'blade'
        // nullable,
        // ...rest,
      } as Config

      try {
        var openAPIData = await getOpenAPIConfig(
          "http://petstore.swagger.io/v2/swagger.json"
        );
        console.log("openAPIData", openAPIData);

        const basePath = "";
        const apiData = genApiData(openAPIData, basePath);

        genFile(apiData, basePath, config);
        console.log("apiData", apiData);
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
