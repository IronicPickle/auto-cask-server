import { error, ok, unauthorizedError } from "@shared/utils/api";
import { UserGetSelf } from "@shared/ts/api/users";
import { User } from "@mongoose/schemas/User";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<UserGetSelf>("/self", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const user = await User.findById(req.user._id, "email displayName createdOn");

    if (!user) throw Error("No user attached to session");

    ok(user)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
