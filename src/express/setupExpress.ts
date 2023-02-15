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
import organisationCreate from "./organisation/create";
import organisationUpdate from "./organisation/update";
import organisationDelete from "./organisation/delete";
import organisationGet from "./organisation/get";
import organisationLeave from "./organisation/leave";
import organisationMembersGetAll from "./organisation/members/getAll";
import organisationMembersGet from "./organisation/members/get";
import organisationMembersRemove from "./organisation/members/remove";
import organisationMembersUpdateRole from "./organisation/members/updateRole";
import organisationInvitesCreate from "./organisation/invites/create";
import organisationInvitesDelete from "./organisation/invites/delete";
import organisationInvitesAccept from "./organisation/invites/accept";
import organisationInvitesReject from "./organisation/invites/reject";
import organisationInvitesGetAll from "./organisation/invites/getAll";
import organisationPumpsGet from "./organisation/pumps/get";
import organisationPumpsGetAll from "./organisation/pumps/getAll";
import organisationPumpsCreate from "./organisation/pumps/create";
import organisationPumpsUpdate from "./organisation/pumps/update";
import organisationPumpsDelete from "./organisation/pumps/delete";
import pumpClientSetup from "./pumpClient/setup";
import pumpClientFingerprint from "./pumpClient/fingerprint";
import userGet from "./user/get";
import userGetSelf from "./user/getSelf";
import userGetMemberships from "./user/getMemberships";
import userGetInvites from "./user/getInvites";

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

  expressServer.use("/organisation", organisationCreate);
  expressServer.use("/organisation", organisationUpdate);
  expressServer.use("/organisation", organisationDelete);
  expressServer.use("/organisation", organisationGet);
  expressServer.use("/organisation", organisationLeave);

  expressServer.use("/organisation/members", organisationMembersGetAll);
  expressServer.use("/organisation/members", organisationMembersGet);
  expressServer.use("/organisation/members", organisationMembersRemove);
  expressServer.use("/organisation/members", organisationMembersUpdateRole);

  expressServer.use("/organisation/invites", organisationInvitesCreate);
  expressServer.use("/organisation/invites", organisationInvitesDelete);
  expressServer.use("/organisation/invites", organisationInvitesAccept);
  expressServer.use("/organisation/invites", organisationInvitesReject);
  expressServer.use("/organisation/invites", organisationInvitesGetAll);

  expressServer.use("/organisation/pumps", organisationPumpsGet);
  expressServer.use("/organisation/pumps", organisationPumpsGetAll);
  expressServer.use("/organisation/pumps", organisationPumpsCreate);
  expressServer.use("/organisation/pumps", organisationPumpsUpdate);
  expressServer.use("/organisation/pumps", organisationPumpsDelete);

  expressServer.use("/pumpClient", pumpClientSetup);
  expressServer.use("/pumpClient", pumpClientFingerprint);

  expressServer.use("/user", userGet);
  expressServer.use("/user", userGetSelf);
  expressServer.use("/user", userGetMemberships);
  expressServer.use("/user", userGetInvites);
};
