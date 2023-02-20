import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { BadgesCreate } from "@shared/ts/api/badges";
import { error, ok, unauthorizedError, validationError } from "@shared/utils/api";
import badgeValidators from "@shared/validators/badgeValidators";
import { parseValidators } from "@shared/utils/generic";

const router = new WrappedRouter();

router.put<BadgesCreate>("/", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { name, breweryName } = req.body;

    const validators = badgeValidators.create(req.body);

    const validation = parseValidators(validators);

    if (validation.failed || !name || !breweryName) return validationError(validation)(res);

    const { _id } = await Badge.create({
      name,
      breweryName,
      createdBy: req.user._id,
    });

    const badge = await Badge.findById(_id).populate([
      {
        path: "createdBy",
        select: "displayName createdOn",
      },
    ]);

    ok(badge)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
