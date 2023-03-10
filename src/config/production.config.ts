import { Config } from "./config";

const config: Config = {
  httpPort: 8010,
  zmqPort: 8011,
  mongoUrl: "mongodb://127.0.0.1:27017/auto_cask",
  sessionSecret: process.env.SESSION_SECRET,
};

export default config;
