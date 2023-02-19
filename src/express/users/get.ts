import userValidators from "@shared/validators/userValidators";
import { parseValidators } from "@shared/utils/generic";
import { error, notFoundError, ok, validationError } from "@shared/utils/api";
import { UserGet } from "@shared/ts/api/users";
import { User } from "@mongoose/schemas/User";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<UserGet>("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const validators = userValidators.get(req.params);

    let validation = parseValidators(validators);
    if (validation.failed || !userId) return validationError(validation)(res);

    const user = await User.findById(userId, "displayName createdOn");

    if (!user) return notFoundError("No user exists with that id")(res);

    ok(user)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
