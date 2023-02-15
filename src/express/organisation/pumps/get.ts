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
import { OrganisationPumpsGetReq, OrganisationPumpsGetRes } from "@shared/ts/api/organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";

const router = Router();

router.get<"/get", {}, OrganisationPumpsGetRes, {}, Partial<OrganisationPumpsGetReq>>(
  "/get",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { pumpId } = req.query;

      const validators = organisationValidators.pumpsGet(req.query);

      const validation = parseValidators(validators);

      if (validation.failed || !pumpId) return validationError(validation)(res);

      const pump = await OrganisationPump.findById(pumpId).populate([
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
  },
);

export default router;
