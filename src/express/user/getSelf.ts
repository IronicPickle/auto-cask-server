import { Router } from "express";
import { error, ok, unauthorizedError } from "@shared/utils/api";
import { UserGetSelfReq, UserGetSelfRes } from "@shared/ts/api/user";
import { User } from "@mongoose/schemas/User";

const router = Router();

router.get<"/getSelf", {}, UserGetSelfRes, Partial<UserGetSelfReq>>(
  "/getSelf",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const user = await User.findById(req.user._id, "email displayName createdOn");

      if (!user) throw Error("No user attached to session");

      ok(user)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
