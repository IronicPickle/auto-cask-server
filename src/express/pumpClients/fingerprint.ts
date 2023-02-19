import { Router } from "express";
import pumpClientValidators from "@shared/validators/pumpClientValidators";
import { parseValidators } from "@shared/utils/generic";
import { error, notFoundError, ok, unauthorizedError, validationError } from "@shared/utils/api";
import { PumpClientFingerprint } from "@shared/ts/api/pumpClients";
import { PumpClient } from "@mongoose/schemas/PumpClient";
import { checkIsAuthed } from "./shared";
import { User } from "@mongoose/schemas/User";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.post<PumpClientFingerprint>("/:mac/fingerprint/", async (req, res) => {
  try {
    const { mac } = req.params;
    const { userId } = req.body;

    if (!(await checkIsAuthed(req, mac)))
      return unauthorizedError("Bearer token missing or invalid")(res);

    const validators = pumpClientValidators.fingerprint({ ...req.params, ...req.body });

    const validation = parseValidators(validators);

    if (validation.failed || !mac || !userId) return validationError(validation)(res);

    const pumpClient = await PumpClient.findOne({ mac });

    if (!pumpClient) return notFoundError("No pump client exists with that mac address.")(res);

    const user = await User.findById(userId);

    if (!user) return notFoundError("No user exists with that id.")(res);

    if (!pumpClient.fingerprintedUsers.find(({ _id }) => _id.equals(userId))) {
      const updatedPumpClient = await PumpClient.findOneAndUpdate(
        { mac },
        {
          $push: {
            fingerprintedUsers: userId,
          },
        },
        { new: true, fields: "mac fingerprintedUsers createdOn" },
      ).populate([
        {
          path: "fingerprintedUsers.user",
          select: "displayName createdOn",
        },
      ]);
      return ok(updatedPumpClient)(res);
    }

    ok(pumpClient)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
