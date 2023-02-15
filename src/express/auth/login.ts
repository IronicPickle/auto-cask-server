import { Router } from "express";
import { LoginReq, LoginRes } from "@shared/ts/api/auth";
import authValidators from "@shared/validators/authValidators";
import { escapeRegExp, parseValidators } from "@shared/utils/generic";
import { error, ok, unauthorizedError, validationError } from "@shared/utils/api";
import { compareSync } from "bcryptjs";
import { User } from "@src/mongoose/schemas/User";
import { generateAccessToken, generateRefreshToken } from "./shared";

const router = Router();

router.post<"/login", {}, LoginRes, Partial<LoginReq>>("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const validators = authValidators.login(req.body);
    const validation = parseValidators(validators);

    if (validation.failed || !email || !password) return validationError(validation)(res);

    const user = await User.findOne(
      {
        email: {
          $regex: new RegExp(`^${escapeRegExp(email)}$`, "i"),
        },
      },
      "password",
    );

    if (!user)
      return unauthorizedError("Either the email or password provided are incorrect.")(res);

    const isPasswordCorrect = compareSync(password, user.password);

    if (!isPasswordCorrect)
      return unauthorizedError("Either the email or password provided are incorrect.")(res);

    const accessToken = await generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    ok({
      accessToken,
      refreshToken,
    })(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router;
