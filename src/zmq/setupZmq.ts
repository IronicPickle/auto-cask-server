import config from "@config/config";
import { log } from "@lib/utils/generic";
import { Router, Reply } from "zeromq";
import { getZmqRoutingId, getZmqData, serialiseZmqRequest } from "@shared/utils/zmq";
import z85 from "z85";

export default async () => {
  setupZap();
  setupRouter();
};

const setupZap = async () => {
  const sock = new Reply();

  await sock.bind("inproc://zeromq.zap.01");
  log("[ZMQ ZAP]", "Bound to to", "inproc://zeromq.zap.01");

  for await (const frames of sock) {
    const version = frames[0].toString();
    const requestId = frames[1].toString();
    const domain = frames[2].toString();
    const address = frames[3].toString();
    const identity = frames[4].toString();
    const mechanism = frames[5].toString();
    const clientKey = z85.encode(frames[6]);

    console.log({
      version,
      requestId,
      domain,
      address,
      identity,
      mechanism,
      clientKey,
    });

    const shouldAccept = true;

    sock.send([version, requestId, shouldAccept ? "200" : "400", "Test1", "Test2", ""]);
  }
};

const setupRouter = async () => {
  const sock = new Router({
    curveServer: true,
    curveSecretKey: "pxw@1wo9*Os6}k((^$/vpEDR9(X!mtc$M4uHp%yO",
  });

  await sock.bind(`tcp://*:${config.zmqPort}`);
  log("[ZMQ]", "Bound to to", config.zmqPort);

  for await (const frames of sock) {
    try {
      const routingId = getZmqRoutingId(frames);
      const data = getZmqData(frames, 2);
      if (!routingId || !data) continue;

      console.log({ routingId, data });

      await sock.send([
        routingId,
        "",
        serialiseZmqRequest("sub-res", {
          val: "hi back",
        }),
      ]);
    } catch (err) {
      console.error(err);
    }
  }
};
