import { error, ok, unauthorizedError } from "@shared/utils/api";
import { UserGetInvites } from "@shared/ts/api/users";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<UserGetInvites>("/self/invites", async (req, res) => {
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
});

export default router.router;
