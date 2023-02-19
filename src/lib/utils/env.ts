import fs from "fs";
import path from "path";

export const envWrite = (key: string, value: string) => {
  const envPath = path.join(__dirname, "../../../.env");
  const envLine = `\n${key}="${value}"`;

  if (fs.existsSync(envPath)) {
    let envFile = fs.readFileSync(envPath, {
      encoding: "utf-8",
    });

    const regex = new RegExp(`(\n|^)(${key}=)(.*)(\n?)`, "g");

    if (regex.test(envFile)) envFile = envFile.replace(regex, `$1$2"${value}"$4`);
    else envFile = `${envFile}${envLine}`;

    fs.writeFileSync(envPath, envFile, {
      encoding: "utf-8",
    });
  } else {
    fs.appendFileSync(envPath, envLine, {
      encoding: "utf-8",
    });
  }

  process.env[key] = value;
};
