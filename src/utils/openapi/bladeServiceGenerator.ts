import {
  OperationObject,
  PathItemObject,
  ReferenceObject,
  SchemaObject,
} from "openapi3-ts/oas30";
import { GenerateServiceProps } from "./typing";
import getOpenAPIConfig from "./getOpenAPIConfig";
import getType from "./getType";

const DEFAULT_SCHEMA: SchemaObject = {
  type: "object",
  properties: { id: { type: "number" } },
};

// 获取 TS 类型的属性列表
const getProps = (schemaObject: SchemaObject) => {
  const requiredPropKeys = schemaObject?.required ?? false;
  return schemaObject.properties
    ? Object.keys(schemaObject.properties).map((propName) => {
        const schema: SchemaObject =
          (schemaObject.properties &&
            (schemaObject.properties[propName] as SchemaObject)) ||
          DEFAULT_SCHEMA;
        return {
          ...schema,
          name: propName,
          type: getType(schema),
          desc: [schema.title, schema.description].filter((s) => s).join(" "),
          // 如果没有 required 信息，默认全部是非必填
          required: requiredPropKeys
            ? requiredPropKeys.some((key) => key === propName)
            : false,
        };
      })
    : [];
};

export const getPagePaths = (openApis: GenerateServiceProps[]) =>
  getAllPaths(openApis, (schema) => schema.title!.includes("Page«"));

export const getDetailPaths = (openApis: GenerateServiceProps[]) =>
  getAllPaths(
    openApis,
    (schema) =>
      !schema.title!.includes("Page«") && !schema.title!.includes("List«")
  );

const getAllPaths = async (
  openApis: GenerateServiceProps[],
  schemaFilter: (schema: SchemaObject) => boolean
) => {
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

        if (!operationObject.responses?.["200"]?.content) {
          return;
        }
        var ref =
          operationObject.responses["200"].content[
            Object.keys(operationObject.responses["200"].content)[0]
          ].schema?.$ref;
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
        if (schemaFilter(childrenSchema)) {
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

          var rowKey: any = Object.keys(childrenSchema.properties || {}).filter(
            (it) =>
              it === "id" ||
              (
                childrenSchema.properties![it] as SchemaObject
              ).description?.includes("主键")
          )[0];

          var props = getProps(childrenSchema);
          allPaths[p] = {
            path: p,
            method,
            props,
            rowKey: rowKey,
            config: openApiConfig,
            schema: childrenSchema,
            // ...operationObject,
          };
        }
      });
    });
  }
  return allPaths;
};

export const getSchemas = async (openApis: GenerateServiceProps[]) => {
  var allPaths: Record<string, any> = {};

  for (const openApiConfig of openApis) {
    var openAPIData = await getOpenAPIConfig(
      openApiConfig.schemaPath!,
      openApiConfig.projectName!
    );
    const { components } = openAPIData;

    // allPaths = [...allPaths, ...]

    Object.keys(components.schemas || {}).forEach((p) => {
      // allPaths[p] = openAPIData.paths[p];
      const schema: SchemaObject = components.schemas[p];

      // let childrenSchema = components.schemas[refName] as SchemaObject;
      if (!schema?.title?.includes("«")) {
        var rowKey: any = Object.keys(schema.properties || {}).filter(
          (it) =>
            it === "id" ||
            (schema.properties![it] as SchemaObject).description?.includes(
              "主键"
            )
        )[0];

        var props = getProps(schema);
        allPaths[`${p}@${openApiConfig.projectName}`] = {
          props,
          rowKey: rowKey,
          config: openApiConfig,
          schema: schema,
          // ...operationObject,
        };
      }
    });
  }
  return allPaths;
};
