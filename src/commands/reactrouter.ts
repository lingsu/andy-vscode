import * as vscode from "vscode";
import * as copyPaste from "copy-paste";
import * as path from "path";

import * as fs from "fs-extra";
// import  * as glob from "glob";
import { glob } from "glob";
import * as recast from "recast";
import * as ts from "typescript";
import { Project, StructureKind } from "ts-morph";

import { getEnv, rootPath } from "../utils/vscodeEnv";
import { getFileContent } from "../utils/file";
import * as _ from "lodash";
import { renderTemplate } from "../utils/ejs";

export const dynamicRouteRE = /^\[(.+)\]$/;
export const cacheAllRouteRE = /^\[\.{3}(.*)\]$/;
export const replaceDynamicRouteRE = /^\[(?:\.{3})?(.*)\]$/;

export const nuxtDynamicRouteRE = /^_(.*)$/;
export const nuxtCacheAllRouteRE = /^_$/;

export const countSlashRE = /\//g;

export const replaceIndexRE = /\/?index$/;

const pageDirPath = path.join("src", "pages");

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

const prepareRoutes = (routes: any[]) => {
  for (const route of routes) {
    route.route = buildReactRoutePath(route.route);
    if (route.route === "index") route.route = "";

    if (route.path) {
      route.path = route.path.replace("src", ".");
      var path = route.path.replace("src", ".");
      route.lazy = `() => import('${path}')`;
      delete route.path;
    }
    if (route.children && route.children.length > 0)
      route.children = prepareRoutes(route.children);
    else {
      delete route.children;
    }

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

  // function getImportString(path: string, importName: string) {
  //   const mode = 'async';
  //   return mode === 'sync'
  //     ? `import ${importName} from "${path}"`
  //     : `const ${importName} = ${
  //       options.resolver.stringify?.dynamicImport?.(path) || `() => import("${path}")`
  //     }`
  // }

  // function componentReplacer(str: string, replaceStr: string, path: string) {
  //   let importName = importsMap.get(path)

  //   if (!importName)
  //     importName = ROUTE_IMPORT_NAME.replace('$1', `${importsMap.size}`)

  //   importsMap.set(path, importName)

  //   importName = options.resolver.stringify?.component?.(importName) || importName

  //   return str.replace(replaceStr, importName)
  // }

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
        .replace(/(\t|\n|\r|\s)/g, "")
  

      // ES6 Arrow Function
      // if (fnBody.length < 8 || fnBody.substring(0, 8) !== 'function')
      //   return `_NuFrRa_${fnBody}`

      return fnBody;
    }
    if (typeof value === "string" && /\/?=>/.test(value)) {
      value = value.substring(1, value.length - 2);
    }

    return value;
  }

  const stringRoutes = JSON.stringify(preparedRoutes, replaceFunction)
  // .replace(/"\(/g, "(")
  // .replace(/\)"/g, ")")
  ;
  // .replace(componentRE, componentReplacer)
  // .replace(hasFunctionRE, functionReplacer)

  // const imports = Array.from(importsMap).map(args => getImportString(...args))

  return {
    imports: [],
    stringRoutes,
  };
}

export function generateClientCode(routes: any[]) {
  const { imports, stringRoutes } = stringifyRoutes(routes);
  const code = `${imports.join(
    ";\n"
  )};\n\nconst routes = ${stringRoutes};\n\nexport default routes;`;
  return code;
}
export default (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "andy-vscode.reactrouter",
    async () => {
      console.log("pageDirPath", pageDirPath);
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user

      //   vscode.window.showInformationMessage("current path:" + rootPath);

      let pageDirFiles = await glob(`src/pages/**/*.{js,tsx}`, {
        cwd: rootPath,
      });
      pageDirFiles = pageDirFiles.sort(
        (a, b) => a.split("\\").length - b.split("\\").length
      );
      const pageRoutes: any[] = [];

      for (const page of pageDirFiles) {
        // console.log("found a page file:", page);
        const route = page.replace(`${pageDirPath}\\`, "").replace(".tsx", "");
        console.log("route:", route);
        const pathRoutes = route.split("\\");

        const fileContent = getFileContent(page);
        // console.log("file content:", getFileContent(page));

        const importMode = /export\s+default/.test(fileContent) ? 'sync': 'async'

        var pageRoute = {
          path: page,
          route: _.last(pathRoutes),
          children: [],
          importMode
        };

        let parentRoutes = pageRoutes;

        var i = 1;
        while (i < pathRoutes.length) {
          var nextNode = parentRoutes.find(
            (it) => it.route == pathRoutes[i - 1]
          );

          if (!nextNode) {
            console.log("create route: ", pathRoutes[i - 1]);
            nextNode = {
              route: pathRoutes[i - 1],
              children: [],
            };
            parentRoutes.push(nextNode);
          }
          console.log("parent route: ", nextNode.route);
          parentRoutes = nextNode.children;
          i++;
        }

        parentRoutes.push(pageRoute);
      }

      let finalRoutes = prepareRoutes(pageRoutes);

      console.log("pageRoutes", JSON.stringify(pageRoutes));
      console.log("finalRoutes", generateClientCode(finalRoutes));

      // var content = await renderTemplate(`
      // export default [
      //   <% model.forEach(function(user){ %>

      //   <% }); %>

      //   {
      //     path: "/",
      //     element: <Root />,
      //     children: [
      //       {
      //         path: "contact",
      //         element: <Contact />,
      //       },
      //       {
      //         path: "dashboard",
      //         element: <Dashboard />,
      //         loader: ({ request }) =>
      //           fetch("/api/dashboard.json", {
      //             signal: request.signal,
      //           }),
      //       },
      //       {
      //         element: <AuthLayout />,
      //         children: [
      //           {
      //             path: "login",
      //             element: <Login />,
      //             loader: redirectIfUser,
      //           },
      //           {
      //             path: "logout",
      //             action: logoutUser,
      //           },
      //         ],
      //       },
      //     ],
      //   },
      //   ]

      // `, {model: finalRoutes});

      // console.log('content',content)
      // var pages = [];
      // for (const dir of pageDirFiles) {
      //   console.log("found a page file:", dir);
      //   // const source = getFileContent(file);
      //   var page = {
      //     path: dir.replace(`${pageDirPath}`, ''),
      //     files: await getPageFiles(dir),
      //   };
      //   pages.push(page);
      //   try {
      //     // const tsAst = recast.parse(source, {
      //     //   parser: require("recast/parsers/typescript"),
      //     //   esprima:{
      //     //     jsx: true,
      //     //     // tsx: true
      //     //   }
      //     // });
      //     // initialize
      //     // const project = new Project({
      //     //   tsConfigFilePath: path.join(env.rootPath, "tsconfig.json"),
      //     //   skipFileDependencyResolution: true,
      //     //   // Optionally specify compiler options, tsconfig.json, in-memory file system, and more here.
      //     //   // If you initialize with a tsconfig.json, then it will automatically populate the project
      //     //   // with the associated source files.
      //     //   // Read more: https://ts-morph.com/setup/
      //     // });
      //     // project.getSourceFile(path.join(env.rootPath, file))
      //     // const sourceFile = ts.createSourceFile("temp.ts", source, {
      //     //   target: "Latest",
      //     // });
      //     // console.log("reactrouter");
      //   } catch (error) {
      //     console.log("error", error);
      //   }

        // console.log("file content:", getFileContent(file));
      // }

      // var pageRouteMap = new Map<string, any>();

      // const addPage = (paths: string[], pageDir: string) => {

      //   for (const p of paths) {
      //     pageRouteMap.set(p, {
      //       path: p,
      //       route: p
      //     })
      //   }

      // };
      // pages.forEach((it) => addPage(it.files, it.path));

      // const pageRoutes  = [];

      // console.log('pages', JSON.stringify(pages))
      // console.log('pageRouteMap', JSON.stringify(pageRouteMap))
      // console.log("first", vscode.Uri);
      // console.log("first", vscode.workspace.rootPath);
      // src/router.tsx
      //   vscode.window.
    }
  );
  context.subscriptions.push(disposable);
};
