import { Router } from "express";
import { error, ok, unauthorizedError } from "@shared/utils/api";
import { UserGetInvitesReq, UserGetInvitesRes } from "@shared/ts/api/user";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";

const router = Router();

router.get<"/getInvites", {}, UserGetInvitesRes, Partial<UserGetInvitesReq>>(
  "/getInvites",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const invites = await OrganisationInvite.find({
        email: req.user.email,
      }).populate([
        {
          path: "organisation",
          select: "name createdOn",
        },
      ]);

      ok(invites)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
