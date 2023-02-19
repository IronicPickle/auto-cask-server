import { Register } from "@shared/ts/api/auth";
import authValidators from "@shared/validators/authValidators";
import { parseValidators } from "@shared/utils/generic";
import { error, ok, validationError } from "@shared/utils/api";
import { hashSync } from "bcryptjs";
import { User } from "@src/mongoose/schemas/User";
import { generateAccessToken } from "./shared";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.post<Register>("/register", async (req, res) => {
  try {
    const { email, displayName, password } = req.body;

    const validators = authValidators.register(req.body);
    const preExistingUser = await User.findOne(
      {
        email,
      },
      "_id",
    );

    validators.email.custom(() =>
      preExistingUser ? "An account already exists with that email" : undefined,
    );
    const validation = parseValidators(validators);

    if (validation.failed || !email || !displayName || !password)
      return validationError(validation)(res);

    const hashedPassword = hashSync(password, 10);

    const user = await User.create({
      email,
      displayName,
      password: hashedPassword,
    });

    const accessToken = await generateAccessToken(user.id);
    const refreshToken = await generateAccessToken(user.id);

    ok({ accessToken, refreshToken })(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong")(res);
  }
});

export default router.router;
