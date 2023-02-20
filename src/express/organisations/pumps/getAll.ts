import { Router } from "express";
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
import { OrganisationsPumpsGetAll } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<OrganisationsPumpsGetAll>("/:organisationId/pumps", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId } = req.params;

    const validators = organisationValidators.pumpsGetAll(req.params);

    const validation = parseValidators(validators);

    if (validation.failed || !organisationId) return validationError(validation)(res);

    const organisation = await Organisation.findById(organisationId);

    if (!organisation) return notFoundError("No organisation exists with that id")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

    if (!permissionChecker.canViewPumps(req.user.id))
      return forbiddenError("You cannot view pumps in this organisation")(res);

    const pumps = await OrganisationPump.find({
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
      {
        path: "badge",
        select: "name breweryName createdBy createdOn",
      },
    ]);

    ok(pumps)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
