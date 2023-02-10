import { Router } from "express";
import { error, ok, unauthorizedError } from "@shared/utils/api";
import { UserGetMembershipsReq, UserGetMembershipsRes } from "@shared/ts/api/user";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";

const router = Router();

router.get<"/getMemberships", {}, UserGetMembershipsRes, Partial<UserGetMembershipsReq>>(
  "/getMemberships",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const memberships = await OrganisationMember.find(
        {
          user: req.user._id,
        },
        "organisation user role joinedOn",
      ).populate([
        {
          path: "user",
          select: "displayName createdOn",
        },
        {
          path: "organisation",
          select: "name createdOn",
        },
      ]);

      ok(memberships)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
