import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { BadgesDelete } from "@shared/ts/api/badges";
import {
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import badgeValidators from "@shared/validators/badgeValidators";
import { parseValidators } from "@shared/utils/generic";
import fs from "fs";

const router = new WrappedRouter();

router.delete<BadgesDelete>("/:badgeId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { badgeId } = req.params;

    const validators = badgeValidators.delete(req.params);

    const validation = parseValidators(validators);

    if (validation.failed || !badgeId) return validationError(validation)(res);

    const badge = await Badge.findById(badgeId).populate([
      {
        path: "createdBy",
        select: "displayName createdOn",
      },
    ]);

    if (!badge) return notFoundError("No badge exists with that id")(res);

    if (!badge.createdBy._id.equals(req.user._id))
      return forbiddenError("You are not the creator of this badge")(res);

    await badge.delete();

    const dirPath = `public/images/badges/${badge.id}`;

    fs.rmSync(dirPath, {
      recursive: true,
      force: true,
    });

    ok(badge)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
