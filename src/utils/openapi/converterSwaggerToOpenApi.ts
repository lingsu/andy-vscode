import Log from "../log";

const converterSwaggerToOpenApi = (swagger: any) => {
  // console.log("swagger", swagger);
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

export default converterSwaggerToOpenApi;
