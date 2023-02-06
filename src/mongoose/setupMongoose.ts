import config from "@config/config";
import { log } from "@lib/utils/generic";
import mongoose from "mongoose";

export default async () => {
  try {
    mongoose.set("strictQuery", true);
    mongoose.set("autoIndex", false);
    await mongoose.connect(config.mongoUrl);
    log("[Mongoose]", `Connected to '${config.mongoUrl}'`);
  } catch (err) {
    throw err;
  }
};
