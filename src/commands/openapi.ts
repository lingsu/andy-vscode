import * as vscode from "vscode";
import * as path from "path";

import { componentsPath, rootPath, tempWorkPath } from "../utils/vscodeEnv";
import { writeFile } from "../utils/file";
import * as _ from "lodash";

import Log from "../utils/log";
import { ServiceGenerator } from "../utils/openapi/serviceGenerator";
import { GenerateServiceProps } from "../utils/openapi/typing";
import { getConfig } from "../utils/config";
import getOpenAPIConfig from "../utils/openapi/getOpenAPIConfig";
import {
  ContentObject,
  OperationObject,
  PathItemObject,
  ReferenceObject,
  SchemaObject,
} from "openapi3-ts/oas30";
import { genCodeByFile } from "../utils/generate";
import { getOutputChannel } from "../utils/outputChannel";

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
      config.schemaPath!,
      config.projectName!,
      true
    );
    // console.log("openAPIData", openAPIData);
    await writeFile(
      JSON.stringify(openAPIData),
      path.join(tempWorkPath, config.projectName + ".json")
    );

    const serviceGenerator = new ServiceGenerator(config, openAPIData);

    await serviceGenerator.genFile();

    vscode.window.showInformationMessage("生成完成");
  } catch (error: any) {
    Log(error.message);
    vscode.window.showErrorMessage(error.message);
    // Log(``+error)
  }
};

const getProjectName = async (openApi: GenerateServiceProps[]) => {
  if (openApi.length < 1) {
    vscode.window.showWarningMessage("未配置OpenApi", {
      modal: true,
    });
    return;
  }
  var projectName: undefined | string = "";
  if (openApi.length > 1) {
    projectName = await vscode.window.showQuickPick(
      openApi.map((x) => x.projectName!),
      {
        placeHolder: "请选择OpenApi",
      }
    );
    if (!projectName) {
      return;
    }
  } else {
    projectName = openApi[0].projectName;
  }

  return projectName;
};

export default (context: vscode.ExtensionContext) => {
  let openapi = vscode.commands.registerCommand(
    "andy-tool.openapi",
    async () => {
      var config = getConfig();
      var openApi = config.openApi || [];

      var projectName = await getProjectName(openApi);
      if (projectName) {
        await run({
          ...openApi.find((x) => x.projectName == projectName),
          templatesFolder: path.join(
            context.extensionPath,
            "materials",
            "blocks",
            "openapi"
          ),
        });
      }
    }
  );
  context.subscriptions.push(openapi);

  let openapiList = vscode.commands.registerCommand(
    "andy-tool.openapiList",
    async (args) => {
      console.log("args", args);
      var config = getConfig();
      var openApis = config.openApis || [];
      if (openApis.length < 1) {
        vscode.window.showWarningMessage("未配置OpenApi", {
          modal: true,
        });
        return;
      }
      getOutputChannel().show();

      var allPaths: Record<string, any> = {};

      for (const openApiConfig of openApis) {
        var openAPIData = await getOpenAPIConfig(
          // "http://petstore.swagger.io/v2/swagger.json"
          openApiConfig.schemaPath!,
          openApiConfig.projectName!
        );
        const { components } = openAPIData;

        // allPaths = [...allPaths, ...]

        Object.keys(openAPIData.paths || {}).forEach((p) => {
          // allPaths[p] = openAPIData.paths[p];
          const pathItem: PathItemObject = openAPIData.paths[p];

          ["get", "put", "post", "delete", "patch"].forEach((method) => {
            const operationObject: OperationObject = pathItem[method];
            if (!operationObject) {
              return;
            }

            var ref =
              operationObject.responses?.["200"]?.content?.["*/*"]?.schema
                ?.$ref;
            // if (!response) {
            //   return;
            // }
            // const resContent: ContentObject | undefined = response.content;
            // const mediaType = Object.keys(resContent || {})[0];
            // if (typeof resContent !== "object" || !mediaType) {
            //   return;
            // }
            // let schema = resContent[mediaType].schema as ReferenceObject;

            if (!ref) {
              return;
            }
            const refPaths = ref.split("/");
            const refName = refPaths[refPaths.length - 1];
            let childrenSchema = components.schemas[refName] as SchemaObject;
            if (childrenSchema.title?.includes("Page«")) {
              while (true) {
                var node: any = ["data", "records"]
                  .map((it) => childrenSchema.properties![it])
                  .filter(Boolean)?.[0];
                if (!node) {
                  break;
                }
                var ref = node.$ref || node.items?.$ref;
                if (!ref) {
                  break;
                }

                childrenSchema = components.schemas[ref.split("/").pop()!];
              }

              var rowKey: any = Object.keys(
                childrenSchema.properties || {}
              ).filter(
                (it) =>
                  it === "id" ||
                  (
                    childrenSchema.properties![it] as SchemaObject
                  ).description?.includes("主键")
              )[0];

              allPaths[p] = {
                path: p,
                method,
                rowKey: rowKey,
                config: openApiConfig,
                schema: childrenSchema,
                ...operationObject,
              };
            }
          });
        });
      }

      var pathName = await vscode.window.showQuickPick(Object.keys(allPaths), {
        placeHolder: "请选择接口",
      });
      if (!pathName) {
        return;
      }

      let selectedPath = allPaths[pathName];
      console.log("selected", selectedPath);

      if (!selectedPath.rowKey) {
        Log(`${selectedPath.schema.title}未设置key`);
      }

      await genCodeByFile(
        {
          openApi: selectedPath,
          config: selectedPath.config,
        },
        path.join(
          context.extensionPath,
          "materials",
          "blocks",
          "openapiPage",
          "page.tsx.ejs"
        ),
        path.join(componentsPath, selectedPath.operationId + ".tsx")
      );
    }
  );
  context.subscriptions.push(openapiList);
};
