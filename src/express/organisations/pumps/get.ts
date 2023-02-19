import organisationValidators from "@shared/validators/organisationValidators";
import { parseValidators } from "@shared/utils/generic";
import {
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import { OrganisationsPumpsGet } from "@shared/ts/api/organisations";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<OrganisationsPumpsGet>("/:organisationId/pumps/:pumpId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId, pumpId } = req.params;

    const validators = organisationValidators.pumpsGet(req.params);

    const validation = parseValidators(validators);

    if (validation.failed || !pumpId || !organisationId) return validationError(validation)(res);

    const pump = await OrganisationPump.findOne({
      _id: pumpId,
      organisation: organisationId,
    }).populate([
      {
        path: "organisation",
        select: "name createdOn",
      },
      {
        path: "pumpClient",
        select: "mac fingerprintedUsers createdOn",
      },
    ]);

    if (!pump) return notFoundError("No pump exists with that id")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(pump.organisation.id);

    if (!permissionChecker.canViewPumps(req.user.id))
      return forbiddenError("You cannot view pumps in this organisation")(res);

    ok(pump)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
