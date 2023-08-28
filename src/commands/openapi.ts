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
import { genCodeByFile, genCodeBySnippet } from "../utils/generate";
import { getOutputChannel } from "../utils/outputChannel";
import {
  getDetailPaths,
  getPagePaths,
  getSchemas,
} from "../utils/openapi/bladeServiceGenerator";
import { formatPath } from "../utils/platform";

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
      var openApis = config.openApis || [];

      var projectName = await getProjectName(openApis);
      if (projectName) {
        await run({
          ...openApis.find((x) => x.projectName == projectName),
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

  let openapiPage = vscode.commands.registerCommand(
    "andy-tool.openapiPage",
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

      var allPaths = await getPagePaths(openApis);

      var pathName = await vscode.window.showQuickPick(Object.keys(allPaths), {
        placeHolder: "请选择接口",
      });
      if (!pathName) {
        return;
      }
      getOutputChannel().show();

      let selectedPath = allPaths[pathName];
      Log(JSON.stringify(selectedPath));

      if (!selectedPath.rowKey) {
        Log(`${selectedPath.schema.title}未设置rowKey`);
      }

      // const instanceName: string = selectedPath.operationId.replace(
      //   /Using\w+/g,
      //   ""
      // )
      // .replace(
      //   /get/g,
      //   ""
      // );
      // const fileName = `${instanceName[0].toUpperCase()}${instanceName.substring(
      //   1
      // )}.tsx`;

      const fileName = `${selectedPath.schema.title}Page.tsx`;
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
        path.join(formatPath(args?.path || componentsPath), fileName)
      );
      Log(`✅ 成功生成 ${fileName} 文件`);
    }
  );
  context.subscriptions.push(openapiPage);

  let openapiDetail = vscode.commands.registerCommand(
    "andy-tool.openapiDetail",
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

      var allPaths = await getDetailPaths(openApis);

      var pathName = await vscode.window.showQuickPick(Object.keys(allPaths), {
        placeHolder: "请选择接口",
      });
      if (!pathName) {
        return;
      }
      getOutputChannel().show();

      let selectedPath = allPaths[pathName];
      Log(JSON.stringify(selectedPath));

      if (!selectedPath.rowKey) {
        Log(`${selectedPath.schema.title}未设置rowKey`);
      }

      // const instanceName: string = selectedPath.operationId.replace(
      //   /Using\w+/g,
      //   ""
      // )
      // .replace(
      //   /get/g,
      //   ""
      // );
      // const fileName = `${instanceName[0].toUpperCase()}${instanceName.substring(
      //   1
      // )}.tsx`;

      const fileName = `${selectedPath.schema.title}Detail.tsx`;
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
          "detail.tsx.ejs"
        ),
        path.join(formatPath(args?.path || componentsPath), fileName)
      );
      Log(`✅ 成功生成 ${fileName} 文件`);
    }
  );
  context.subscriptions.push(openapiDetail);

  let openapiDetailFromSchemas = vscode.commands.registerCommand(
    "andy-tool.openapiDetailFromSchemas",
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

      var allPaths = await getSchemas(openApis);

      var pathName = await vscode.window.showQuickPick(Object.keys(allPaths), {
        placeHolder: "请选择接口",
      });
      if (!pathName) {
        return;
      }
      getOutputChannel().show();

      let selectedPath = allPaths[pathName];
      Log(JSON.stringify(selectedPath));

      if (!selectedPath.rowKey) {
        Log(`${selectedPath.schema.title}未设置rowKey`);
      }

      const fileName = `${selectedPath.schema.title}Detail.tsx`;
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
          "detail.tsx.ejs"
        ),
        path.join(formatPath(args?.path || componentsPath), fileName)
      );
      Log(`✅ 成功生成 ${fileName} 文件`);
    }
  );
  context.subscriptions.push(openapiDetailFromSchemas);

  let openapiColumnsFromSchemas = vscode.commands.registerCommand(
    "andy-tool.openapiColumnsFromSchemas",
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

      var allPaths = await getSchemas(openApis);

      var pathName = await vscode.window.showQuickPick(Object.keys(allPaths), {
        placeHolder: "请选择接口",
      });
      if (!pathName) {
        return;
      }
      getOutputChannel().show();

      let selectedPath = allPaths[pathName];
      Log(JSON.stringify(selectedPath));

      if (!selectedPath.rowKey) {
        Log(`${selectedPath.schema.title}未设置rowKey`);
      }

      await genCodeBySnippet(
        {
          openApi: selectedPath,
          config: selectedPath.config,
        },
        path.join(
          context.extensionPath,
          "materials",
          "blocks",
          "openapiPage",
          "proTableColumns.ejs"
        )
      );
      Log(`✅ 成功生成 ${selectedPath.schema.title} 列定义`);
    }
  );
  context.subscriptions.push(openapiColumnsFromSchemas);
};
