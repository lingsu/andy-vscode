import resolveTypeName from "./resolveTypeName";

function getRefName(refObject: any): string {
    if (typeof refObject !== "object" || !refObject.$ref) {
      return refObject;
    }
    const refPaths = refObject.$ref.split("/");
    return resolveTypeName(refPaths[refPaths.length - 1]) as string;
  }

  export default getRefName;