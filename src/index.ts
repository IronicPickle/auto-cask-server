import setupExpress from "@express/setupExpress";
import setupMongoose from "./mongoose/setupMongoose";
import setupZmq from "./zmq/setupZmq";

const start = async () => {
  setupExpress();
  setupMongoose();

  setupZmq();
};

start();
