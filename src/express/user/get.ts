import { Router } from "express";
import userValidators from "@shared/validators/userValidators";
import { parseValidators } from "@shared/utils/generic";
import { error, notFoundError, ok, validationError } from "@shared/utils/api";
import { UserGetReq, UserGetRes } from "@shared/ts/api/user";
import { User } from "@mongoose/schemas/User";

const router = Router();

router.get<"/get", {}, UserGetRes, Partial<UserGetReq>>("/get", async (req, res) => {
  try {
    const { userId } = req.body;

    const validators = userValidators.get(req.body);

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

export default router;
