import { error, ok, unauthorizedError } from "@shared/utils/api";
import { UserGetMemberships } from "@shared/ts/api/users";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<UserGetMemberships>("/self/memberships", async (req, res) => {
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
});

export default router.router;
