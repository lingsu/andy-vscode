import { MediaTypeObject, ParameterObject, PathItemObject, ReferenceObject, SchemaObject } from "openapi3-ts/oas30";
import getRefName from "./getRefName";

const getType = (
  schemaObject?:  SchemaObject | ReferenceObject,
  namespace: string = ""
): string => {
  if (schemaObject === undefined || schemaObject === null) {
    return "any";
  }
  if (typeof schemaObject !== "object") {
    return schemaObject;
  }
  if ((schemaObject as ReferenceObject).$ref) {
    return [namespace, getRefName(schemaObject)].filter((s) => s).join(".");
  }

  schemaObject = schemaObject as SchemaObject;

  let { type } = schemaObject as any;

  const numberEnum = [
    "int64",
    "integer",
    "long",
    "float",
    "double",
    "number",
    "int",
    "float",
    "double",
    "int32",
    "int64",
  ];

  const dateEnum = ["Date", "date", "dateTime", "date-time", "datetime"];

  const stringEnum = ["string", "email", "password", "url", "byte", "binary"];

  if (numberEnum.includes(schemaObject.format!)) {
    type = "number";
  }

  if (schemaObject.enum) {
    type = "enum";
  }

  if (numberEnum.includes(type)) {
    return "number";
  }

  if (dateEnum.includes(type)) {
    return "Date";
  }

  if (stringEnum.includes(type)) {
    return "string";
  }

  if (type === "boolean") {
    return "boolean";
  }

  if (type === "array") {
    let { items, schema } = schemaObject as any;
    if (schema) {
      items = (schema as SchemaObject).items;
    }

    if (Array.isArray(items)) {
      const arrayItemType = (items as any)
        .map((subType) => getType(subType.schema || subType, namespace))
        .toString();
      return `[${arrayItemType}]`;
    }
    const arrayType = getType(items as SchemaObject, namespace);
    return arrayType.includes(" | ") ? `(${arrayType})[]` : `${arrayType}[]`;
  }

  if (type === "enum") {
    return Array.isArray(schemaObject.enum)
      ? Array.from(
          new Set(
            (schemaObject as SchemaObject).enum.map((v) =>
              typeof v === "string" ? `"${v.replace(/"/g, '"')}"` : getType(v)
            )
          )
        ).join(" | ")
      : "string";
  }

  if (schemaObject.oneOf && schemaObject.oneOf.length) {
    return schemaObject.oneOf
      .map((item: SchemaObject) => getType(item, namespace))
      .join(" | ");
  }
  if (schemaObject.allOf && schemaObject.allOf.length) {
    return `(${schemaObject.allOf
      .map((item: SchemaObject) => getType(item, namespace))
      .join(" & ")})`;
  }
  if (schemaObject.type === "object" || schemaObject.properties) {
    if (!Object.keys(schemaObject.properties || {}).length) {
      return "Record<string, any>";
    }
    return `{ ${Object.keys(schemaObject.properties)
      .map((key) => {
        const required =
          "required" in ((schemaObject as any).properties[key] || {})
            ? (((schemaObject as any).properties[key] || {}) as any).required
            : false;
        /**
         * 将类型属性变为字符串，兼容错误格式如：
         * 3d_tile(数字开头)等错误命名，
         * 在后面进行格式化的时候会将正确的字符串转换为正常形式，
         * 错误的继续保留字符串。
         * */
        return `'${key}'${required ? "" : "?"}: ${getType(
          (schemaObject as any).properties && (schemaObject as any).properties[key] as any,
          namespace
        )}; `;
      })
      .join("")}}`;
  }
  return "any";
};

export default getType;
