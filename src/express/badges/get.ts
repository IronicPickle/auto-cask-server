import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { BadgesGet } from "@shared/ts/api/badges";
import { error, notFoundError, ok, unauthorizedError, validationError } from "@shared/utils/api";
import badgeValidators from "@shared/validators/badgeValidators";
import { parseValidators } from "@shared/utils/generic";

const router = new WrappedRouter();

router.get<BadgesGet>("/:badgeId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { badgeId } = req.params;

    const validators = badgeValidators.get(req.params);

    const validation = parseValidators(validators);

    if (validation.failed || !badgeId) return validationError(validation)(res);

    const badge = await Badge.findById(badgeId).populate([
      {
        path: "createdBy",
        select: "displayName createdOn",
      },
    ]);

    if (!badge) return notFoundError("No badge exists with that id")(res);

    ok(badge)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
