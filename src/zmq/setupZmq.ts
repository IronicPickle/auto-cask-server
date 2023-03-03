import config from "@config/config";
import { log } from "@lib/utils/generic";
import { Router, Reply, curveKeyPair } from "zeromq";
import { getZmqRoutingId, zmqSerialise, zmqDeserialise } from "@shared/utils/zmq";
import z85 from "z85";
import { envWrite } from "@lib/utils/env";
import { ZmqRequestType } from "@shared/enums/zmq";
import { PumpClient } from "@mongoose/schemas/PumpClient";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";

export const sock = new Router({
  curveServer: true,
  handover: true,
});

export const sockSend = async (clientPublicKey: string, type: ZmqRequestType, data?: object) =>
  await sock.send([clientPublicKey, "", zmqSerialise(type, data)]);

export default async () => {
  setupKeys();

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
    const publicKey = z85.encode(frames[6]);

    const shouldAccept = !!(await PumpClient.findOne({ publicKey }));

    sock.send([version, requestId, shouldAccept ? "200" : "400", "Test1", "Test2", ""]);
  }
};

const setupRouter = async () => {
  const { PUBLIC_KEY, SECRET_KEY } = process.env;

  if (!PUBLIC_KEY || !SECRET_KEY) throw Error("Missing one or more ZMQ keys");

  sock.curveSecretKey = SECRET_KEY;

  sock.events.on("accept", () => log("[ZMQ]", "Client connected"));

  await sock.bind(`tcp://*:${config.zmqPort}`);
  log("[ZMQ]", "Bound to to", config.zmqPort);

  for await (const frames of sock) {
    try {
      const routingId = getZmqRoutingId(frames);
      const res = zmqDeserialise(frames[2]);
      if (!routingId || !res || !routingId) continue;

      if (!res) continue;

      const { type, data } = res;

      log("[ZMQ]", type, data);

      switch (type) {
        case ZmqRequestType.GetBadge: {
          const pumpClient = await PumpClient.findOne({
            publicKey: routingId,
          });
          if (!pumpClient) break;

          const pump = await OrganisationPump.findOne({
            pumpClient: pumpClient?._id,
          }).populate([
            {
              path: "badge",
              select: "name breweryName createdBy createdOn",
            },
          ]);
          if (!pump) break;

          sockSend(routingId, ZmqRequestType.BadgeData, pump.badge);

          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
};

const setupKeys = () => {
  const { PUBLIC_KEY, SECRET_KEY } = process.env;
  if (PUBLIC_KEY && SECRET_KEY) return;

  log("[ZMQ]", "Generating keys...");

  const { publicKey, secretKey } = curveKeyPair();

  envWrite("PUBLIC_KEY", publicKey);
  envWrite("SECRET_KEY", secretKey);
};
