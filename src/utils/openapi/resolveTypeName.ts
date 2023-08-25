import Log from "../log";
import * as pinyin from "tiny-pinyin";

// 类型声明过滤关键字
const resolveTypeName = (typeName: string) => {
    //   if (ReservedDict.check(typeName)) {
    //     return `__openAPI__${typeName}`;
    //   }
    // console.log("resolveTypeName", typeName);
  
    while (typeName.includes("__")) {
      typeName = typeName.replace("__", "_");
    }
    if (typeName.endsWith("_")) {
      typeName = typeName.substring(0, typeName.length - 1);
    }
  
    const typeLastName = typeName.split("/").pop().split(".").pop();
  
    const name = typeLastName
      .replace(/[-_ ](\w)/g, (_all, letter) => letter.toUpperCase())
      .replace(/[^\w^\s^\u4e00-\u9fa5]/gi, "");
  
    // 当model名称是number开头的时候，ts会报错。这种场景一般发生在后端定义的名称是中文
    if (name === "_" || /^\d+$/.test(name)) {
      Log(
        "⚠️  models不能以number开头，原因可能是Model定义名称为中文, 建议联系后台修改"
      );
      return `Pinyin_${name}`;
    }
    if (!/[\u3220-\uFA29]/.test(name) && !/^\d$/.test(name)) {
      return name;
    }
    const noBlankName = name.replace(/ +/g, "");
    return pinyin
      .convertToPinyin(noBlankName, "-", true)
      .split("-")
      .map((it) => it[0].toUpperCase() + it.substring(1))
      .join("");
  };

  export default resolveTypeName;