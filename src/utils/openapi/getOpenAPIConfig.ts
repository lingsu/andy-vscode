import * as path from "path";
import * as _ from "lodash";
import * as fs from "fs-extra";
import { getFileContent } from "../file";
import Log from "../log";
import { tempWorkPath } from "../vscodeEnv";
import converterSwaggerToOpenApi from "./converterSwaggerToOpenApi";
import getSchema from "./getSchema";


const getOpenAPIConfig = async (
    schemaPath: string,
    projectName: string,
    sync= false
  ) => {
  
    if (
      sync === false &&
      fs.existsSync(path.join(tempWorkPath, "openapi", projectName + "OpenApi.json"))
    ) {
      Log('使用缓存openAPI配置')
      return JSON.parse(
        getFileContent(
          path.join(tempWorkPath, "openapi", projectName + "OpenApi.json"),
          true
        ) || "{}"
      );
    }
    const schema = await getSchema(schemaPath, projectName);
    if (!schema) {
      return null;
    }
    const openAPI = await converterSwaggerToOpenApi(schema);
  
    return openAPI;
  };

  export default getOpenAPIConfig;