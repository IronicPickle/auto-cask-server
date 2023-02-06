import * as dotenv from "dotenv";
dotenv.config();

import developmentConfig from "./development.config";
import productionConfig from "./production.config";

export interface Config {
  httpPort: number;
  mongoUrl: string;
  sessionSecret?: string;
}

const env = process.env.NODE_ENV ?? "development";

export const isDev = env !== "production";
export const isProd = env === "production";

const config: Record<string, Config> = {
  test: developmentConfig,
  development: developmentConfig,
  production: productionConfig,
};

export default config[env];
