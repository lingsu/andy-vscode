import axios from "axios";
import * as path from "path";
import * as fs from "fs-extra";
import { execa } from "execa";
import { tempDir } from "./vscodeEnv";

export const download = async (
  url: string,
  filePath: string,
  fileName: string
) => {
  // await fs.ensureDir(filePath);
  // const file = fs.createWriteStream(path.join(filePath, fileName));
  // const response = await axios({
  //   url,
  //   responseType: "stream",
  // });

  // await response.data.pipe(file);
  // .on("finish", () => resolve(0))
  // .on("error", (err: any) => {
  //   fs.unlink(filePath, () => reject(err));
  // });

 return new Promise((resolve, reject) => {
    fs.ensureDir(filePath)
      .then(() => {
        const file = fs.createWriteStream(path.join(filePath, fileName));
        axios({
          url,
          responseType: 'stream',
        })
          .then((response) => {
            response.data
              .pipe(file)
              .on('finish', () => {
                resolve(0)
              })
              .on('error', (err: any) => {
                fs.unlink(filePath, () => reject(err));
              });
          })
          .catch((ex: any) => {
            reject(ex);
          });
      })
      .catch((ex: any) => {
        reject(ex);
      });
  });
};

export const downloadMaterialsFromGit = async (remote: string) => {
  await fs.ensureDir(tempDir.temp);
  await fs.remove(tempDir.materials);
  await execa("git", ["clone", ...remote.split(" "), tempDir.materials]);
};
