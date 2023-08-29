import * as vscode from "vscode";
import * as path from "path";

import * as fs from "fs-extra";
// import  * as glob from "glob";
import { glob } from "glob";
import * as recast from "recast";
import * as ts from "typescript";
import { Project, StructureKind } from "ts-morph";

import { getEnv, rootPath } from "../utils/vscodeEnv";
import { getFileContent, writeFile } from "../utils/file";
import * as _ from "lodash";
import * as prettier from "prettier";

import { renderTemplate } from "../utils/ejs";
import { getOutputChannel } from "../utils/outputChannel";

type PageRoute = {
  path: string;
  route: string;
};
type ReactRouteBase = {
  caseSensitive?: boolean;
  children?: ReactRouteBase[];
  element?: string;
  lazy?: string;
  index?: boolean;
  path?: string;
  loader?: string;
  rawRoute: string;
};
type ReactRoute = Omit<
  Pick<Partial<ReactRouteBase>, "rawRoute" | "path">,
  "children"
> & {
  children?: ReactRoute[];
};

export const ROUTE_IMPORT_NAME = "__pages_import_$1__";

export const dynamicRouteRE = /^\[(.+)\]$/;
export const cacheAllRouteRE = /^\[\.{3}(.*)\]$/;
export const replaceDynamicRouteRE = /^\[(?:\.{3})?(.*)\]$/;

export const nuxtDynamicRouteRE = /^_(.*)$/;
export const nuxtCacheAllRouteRE = /^_$/;

export const countSlashRE = /\//g;

export const replaceIndexRE = /\/?index$/;

const componentRE = /"(?:component|element)":("(.*?)")/g;
const componentLAZY = /"(?:lazy)":("(.*?)")/g;
const hasFunctionRE = /"(?:props|beforeEnter)":("(.*?)")/g;

const multilineCommentsRE = /\/\*(.|[\r\n])*?\*\//gm;
const singlelineCommentsRE = /\/\/.*/g;

const pageDirPath = path.join("src", "pages");

const targetFilePath = path.join(rootPath, "src", "routes.tsx");

const extension = "tsx";

const channel = getOutputChannel();

export function normalizeName(
  name: string,
  isDynamic: boolean,
  nuxtStyle = false
) {
  if (!isDynamic) return name;

  return nuxtStyle
    ? name.replace(nuxtDynamicRouteRE, "$1") || "all"
    : name.replace(replaceDynamicRouteRE, "$1");
}
export function normalizeCase(str: string, caseSensitive: boolean) {
  if (!caseSensitive) return str.toLocaleLowerCase();
  return str;
}
const buildReactRoutePath = (route: string) => {
  const isDynamic = dynamicRouteRE.test(route);
  const isCatchAll = cacheAllRouteRE.test(route);
  const normalizedName = normalizeName(route, isDynamic);

  if (isDynamic) {
    if (isCatchAll) return "*";

    return `:${normalizedName}`;
  }

  return `${normalizedName}`;
};

const prepareRoutes = (routes: ReactRoute[], parent?: ReactRoute) => {
  for (const route of routes) {
    if (parent) route.path = route.path?.replace(/^\//, "");

    if (route.children) route.children = prepareRoutes(route.children, route);

    delete route.rawRoute;

    // Object.assign(route, options.extendRoute?.(route, parent) || {})
  }

  return routes;
};

/**
 * Creates a stringified Vue Router route definition.
 */
export function stringifyRoutes(preparedRoutes: any[]) {
  const importsMap: Map<string, string> = new Map();

  function getImportString(path: string, importName: string) {
    return `import ${importName} from "${path}"`;

    // const mode = 'async';
    // return mode === 'sync'
    //   ? `import ${importName} from "${path}"`
    //   : `const ${importName} = ${
    //     options.resolver.stringify?.dynamicImport?.(path) || `() => import("${path}")`
    //   }`
  }

  function componentReplacer(str: string, replaceStr: string, path: string) {
    // console.log("componentReplacer", str, replaceStr, path);
    let importName = importsMap.get(path);

    if (!importName)
      importName = ROUTE_IMPORT_NAME.replace("$1", `${importsMap.size}`);

    importsMap.set(path, importName);

    // importName = options.resolver.stringify?.component?.(importName) || importName

    // return str.replace(replaceStr, `React.createElement(${importName})`);
    return str.replace(replaceStr, `<${importName} />`);
  }

  function lazyComponentReplacer(
    str: string,
    replaceStr: string,
    path: string
  ) {
    // console.log("lazyComponentReplacer", str, replaceStr, path);

    // importName = options.resolver.stringify?.component?.(importName) || importName

    return str.replace(replaceStr, `() => import("${path}")`);
  }

  function functionReplacer(str: string, replaceStr: string, content: string) {
    if (content.startsWith("function")) return str.replace(replaceStr, content);

    if (content.startsWith("_NuFrRa_"))
      return str.replace(replaceStr, content.slice(8));

    return str;
  }
  function replaceFunction(_: any, value: any) {
    if (value instanceof Function || typeof value === "function") {
      const multilineCommentsRE = /\/\*(.|[\r\n])*?\*\//gm;
      const singlelineCommentsRE = /\/\/.*/g;

      const fnBody = value
        .toString()
        .replace(multilineCommentsRE, "")
        .replace(singlelineCommentsRE, "")
        .replace(/(\t|\n|\r|\s)/g, "");

      // ES6 Arrow Function
      // if (fnBody.length < 8 || fnBody.substring(0, 8) !== 'function')
      //   return `_NuFrRa_${fnBody}`

      return fnBody;
    }
    // if (typeof value === "string" && /\/?=>/.test(value)) {
    //   value = value.substring(1, value.length - 2);
    // }

    return value;
  }

  const stringRoutes = JSON.stringify(preparedRoutes, replaceFunction)
    // .replace(/"\(/g, "(")
    // .replace(/\)"/g, ")")
    .replace(componentRE, componentReplacer)
    .replace(componentLAZY, lazyComponentReplacer);
  // .replace(hasFunctionRE, functionReplacer)

  const imports = Array.from(importsMap).map((args) =>
    getImportString(...args)
  );

  return {
    imports: imports,
    stringRoutes,
  };
}

export async function generateClientCode(routes: any[]) {
  const { imports, stringRoutes } = stringifyRoutes(routes);
  let code = `${imports.join(
    ";\n"
  )};\n\nconst routes = ${stringRoutes};\n\nexport default routes;`;

  return code;
}
export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-tool.reactrouter",
    async () => {
      channel.show();
      channel.appendLine("page dir path : " + pageDirPath);
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user

      //   vscode.window.showInformationMessage("current path:" + rootPath);

      let pageDirFiles = await glob(`src/pages/**/*.{js,tsx}`, {
        cwd: rootPath,
        ignore: "**/components/**",
      });
      // pageDirFiles = pageDirFiles.sort(
      //   (a, b) => a.split("\\").length - b.split("\\").length
      // );
      const pageRouteMap = new Map<string, PageRoute>();

      for (const p of pageDirFiles) {
        channel.appendLine("find a file " + p);

        // pageRoutes.push({});
        const route = p
          .replace(`${pageDirPath}\\`, "")
          .replace(`.${extension}`, "")
          .split("\\")
          .join("/");

        pageRouteMap.set(p, {
          path: p,
          route,
        });
      }

      const pageRoutes = [...pageRouteMap.values()]
        // sort routes for HMR
        .sort((a, b) => a.route.split("/").length - b.route.split("/").length);

      const routes: ReactRouteBase[] = [];
      const caseSensitive = false;
      pageRoutes.forEach((page) => {
        const fileContent = getFileContent(page.path);
        // console.log("file content:", getFileContent(page));

        const importMode = /export\s+default/.test(fileContent)
          ? "sync"
          : "async";

        const pathNodes = page.route.split("/");
        const element =
          "./pages" +
          page.path
            .replace(pageDirPath, "")
            .split("\\")
            .join("/")
            .replace(`.${extension}`, "");
        let parentRoutes = routes;

        for (let i = 0; i < pathNodes.length; i++) {
          const node = pathNodes[i];

          const route: ReactRouteBase = {
            caseSensitive,
            path: "",
            rawRoute: pathNodes.slice(0, i + 1).join("/"),
          };

          if (i === pathNodes.length - 1) {
            if (importMode == "sync") {
              route.element = element;
            } else {
              route.lazy = element;
            }
          }

          const isIndexRoute = normalizeCase(node, caseSensitive).endsWith(
            "index"
          );

          if (!route.path && isIndexRoute) {
            route.path = "/";
          } else if (!isIndexRoute) {
            route.path = buildReactRoutePath(node);
          }

          const parent = parentRoutes.find((parent) => {
            return pathNodes.slice(0, i).join("/") === parent.rawRoute;
          });

          if (parent) {
            // Make sure children exits in parent
            parent.children = parent.children || [];
            // Append to parent's children
            parentRoutes = parent.children;
          }

          const exits = parentRoutes.some((parent) => {
            return pathNodes.slice(0, i + 1).join("/") === parent.rawRoute;
          });
          if (!exits) parentRoutes.push(route);
        }
      });

      let finalRoutes = prepareRoutes(routes);

      var code = await generateClientCode(finalRoutes);

      writeFile(code, targetFilePath);

      vscode.window.showInformationMessage("react router生成完成!");
    }
  );
  context.subscriptions.push(disposable);
};
