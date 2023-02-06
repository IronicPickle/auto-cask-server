import setupExpress from "@express/setupExpress";
import setupMongoose from "./mongoose/setupMongoose";

const start = async () => {
  setupExpress();
  setupMongoose();
};

start();
