import { Router } from "express";
import { RefreshReq, RefreshRes } from "@shared/ts/api/auth";
import { badRequestError, error, ok, validationError } from "@shared/utils/api";
import authValidators from "@shared/validators/authValidators";
import { isString, parseValidators } from "@shared/utils/generic";
import { generateAccessToken } from "./shared";
import jwt from "jsonwebtoken";
import config from "@config/config";
import { User } from "@mongoose/schemas/User";
import { GenericErrorCode } from "@shared/enums/api/generic";

const router = Router();

router.post<"/refresh", {}, RefreshRes, Partial<RefreshReq>>("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const validators = authValidators.refresh(req.body);
    const validation = parseValidators(validators);

    if (validation.failed || !refreshToken) return validationError(validation)(res);

    if (!config.sessionSecret)
      throw new Error("Critical error, auth session secret not present, cannot sign jwt tokens");

    let payload = null;
    try {
      payload = jwt.verify(refreshToken, config.sessionSecret, {
        complete: false,
        ignoreExpiration: false,
        ignoreNotBefore: false,
      });
      if (isString(payload)) throw new Error("jwt format error");
    } catch (err: any) {
      return badRequestError(err.message, GenericErrorCode.InvalidToken)(res);
    }

    const { sub } = payload;

    const user = await User.findById(sub);

    if (!user) return badRequestError("Invalid token")(res);

    const accessToken = await generateAccessToken(user.id);

    ok({
      accessToken,
    })(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router;
