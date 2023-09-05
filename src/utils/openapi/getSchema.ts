import { download } from "../download";
import * as path from "path";
import * as _ from "lodash";
import { tempWorkPath } from "../vscodeEnv";
import { getFileContent } from "../file";

const getSchema = async (schemaPath: string, projectName: string) => {
    await download(
      schemaPath,
      path.join(tempWorkPath, "openapi"),
      projectName + "Swagger.json"
    );
    return JSON.parse(
      getFileContent(
        path.join(tempWorkPath, "openapi", projectName + "Swagger.json"),
        true
      ) || "{}"
    );
  };
  export default getSchema