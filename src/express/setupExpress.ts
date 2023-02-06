import config, { isDev } from "@config/config";
import { log } from "@lib/utils/generic";
import express from "express";
import login from "./auth/login";
import register from "./auth/register";
import jwt from "jsonwebtoken";
import { isString } from "@shared/utils/generic";
import { User } from "@mongoose/schemas/User";
import dayjs from "dayjs";
import { ok } from "@shared/utils/api";
import refresh from "./auth/refresh";
import organisationCreate from "./organisation/create";
import organisationUpdate from "./organisation/update";
import organisationDelete from "./organisation/delete";
import organisationGet from "./organisation/get";
import organisationMembersGetAll from "./organisation/members/getAll";
import organisationMembersGet from "./organisation/members/get";
import organisationMembersRemove from "./organisation/members/remove";
import organisationMembersUpdateRole from "./organisation/members/updateRole";
import organisationInvitesCreate from "./organisation/invites/create";
import organisationInvitesDelete from "./organisation/invites/delete";
import organisationInvitesAccept from "./organisation/invites/accept";
import organisationInvitesGetAll from "./organisation/invites/getAll";
import userGet from "./user/get";
import userGetSelf from "./user/getSelf";

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

  expressServer.use("/organisation/members", organisationMembersGetAll);
  expressServer.use("/organisation/members", organisationMembersGet);
  expressServer.use("/organisation/members", organisationMembersRemove);
  expressServer.use("/organisation/members", organisationMembersUpdateRole);

  expressServer.use("/organisation/invites", organisationInvitesCreate);
  expressServer.use("/organisation/invites", organisationInvitesDelete);
  expressServer.use("/organisation/invites", organisationInvitesAccept);
  expressServer.use("/organisation/invites", organisationInvitesGetAll);

  expressServer.use("/user", userGet);
  expressServer.use("/user", userGetSelf);
};
