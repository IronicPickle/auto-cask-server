import config, { isDev } from "@config/config";
import { log } from "@lib/utils/generic";
import express from "express";
import login from "./auth/login";
import register from "./auth/register";
import jwt from "jsonwebtoken";
import { isString } from "@shared/utils/generic";
import { User } from "@mongoose/schemas/User";
import { ok } from "@shared/utils/api";
import refresh from "./auth/refresh";
import organisationsCreate from "./organisations/create";
import organisationsUpdate from "./organisations/update";
import organisationsDelete from "./organisations/delete";
import organisationsGet from "./organisations/get";
import organisationsLeave from "./organisations/leave";
import organisationsMemberGetAll from "./organisations/members/getAll";
import organisationsMemberGet from "./organisations/members/get";
import organisationsMemberRemove from "./organisations/members/remove";
import organisationsMemberUpdateRole from "./organisations/members/updateRole";
import organisationsInviteCreate from "./organisations/invites/create";
import organisationsInviteDelete from "./organisations/invites/delete";
import organisationsInviteAccept from "./organisations/invites/accept";
import organisationsInviteReject from "./organisations/invites/reject";
import organisationsInviteGetAll from "./organisations/invites/getAll";
import organisationsPumpsGet from "./organisations/pumps/get";
import organisationsPumpsGetAll from "./organisations/pumps/getAll";
import organisationsPumpsCreate from "./organisations/pumps/create";
import organisationsPumpsUpdate from "./organisations/pumps/update";
import organisationsPumpsDelete from "./organisations/pumps/delete";
import pumpClientsSetup from "./pumpClients/setup";
import pumpClientsFingerprint from "./pumpClients/fingerprint";
import usersGet from "./users/get";
import usersGetSelf from "./users/getSelf";
import usersGetMemberhips from "./users/getMemberships";
import usersGetInvites from "./users/getInvites";

export const expressServer = express();

export default () => {
  expressServer.use(express.json());
  expressServer.use(
    express.urlencoded({
      extended: true,
    }),
  );

  if (!config.sessionSecret)
    throw new Error("A session secret is required in the env 'SESSION_SECRET'");

  expressServer.use(async (req, _res, next) => {
    const { authorization } = req.headers;
    const accessToken = authorization?.replace("Bearer ", "");

    if (!accessToken) return next();

    if (!config.sessionSecret)
      throw new Error("Critical error, auth session secret not present, cannot sign jwt tokens");

    try {
      const payload = jwt.verify(accessToken, config.sessionSecret, {
        complete: false,
        ignoreExpiration: false,
        ignoreNotBefore: false,
      });
      if (isString(payload)) return next();

      const { sub } = payload;

      const user = await User.findById(sub);
      if (!user) return next();

      req.user = user;

      next();
    } catch (err) {
      next();
    }
  });

  expressServer.get("/auth/test", (req, res) => {
    console.log("User", req.user);
    console.log("Expired User", req.expiredUser);

    ok()(res);
  });

  expressServer.listen(config.httpPort, () =>
    log("[Express]", `Listening on '${config.httpPort}'`),
  );

  if (isDev)
    expressServer.use((req, _res, next) => {
      log(`[${req.method}]`, "-", req.path);
      next();
    });

  expressServer.use("/auth", register);
  expressServer.use("/auth", login);
  expressServer.use("/auth", refresh);

  expressServer.use("/organisations", organisationsCreate);
  expressServer.use("/organisations", organisationsUpdate);
  expressServer.use("/organisations", organisationsDelete);
  expressServer.use("/organisations", organisationsGet);
  expressServer.use("/organisations", organisationsLeave);

  expressServer.use("/organisations", organisationsMemberGetAll);
  expressServer.use("/organisations", organisationsMemberGet);
  expressServer.use("/organisations", organisationsMemberRemove);
  expressServer.use("/organisations", organisationsMemberUpdateRole);

  expressServer.use("/organisations", organisationsInviteCreate);
  expressServer.use("/organisations", organisationsInviteDelete);
  expressServer.use("/organisations", organisationsInviteAccept);
  expressServer.use("/organisations", organisationsInviteReject);
  expressServer.use("/organisations", organisationsInviteGetAll);

  expressServer.use("/organisations", organisationsPumpsGet);
  expressServer.use("/organisations", organisationsPumpsGetAll);
  expressServer.use("/organisations", organisationsPumpsCreate);
  expressServer.use("/organisations", organisationsPumpsUpdate);
  expressServer.use("/organisations", organisationsPumpsDelete);

  expressServer.use("/pumpClients", pumpClientsSetup);
  expressServer.use("/pumpClients", pumpClientsFingerprint);

  expressServer.use("/users", usersGetSelf);
  expressServer.use("/users", usersGetMemberhips);
  expressServer.use("/users", usersGetInvites);
  expressServer.use("/users", usersGet);
};
