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
import {
  OrganisationPumpsUpdateReq,
  OrganisationPumpsUpdateRes,
} from "@shared/ts/api/organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";

const router = Router();

router.patch<"/update", {}, OrganisationPumpsUpdateRes, Partial<OrganisationPumpsUpdateReq>>(
  "/update",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { pumpId, name } = req.body;

      const validators = organisationValidators.pumpsUpdate(req.body);

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

      if (!permissionChecker.canUpdatePumps(req.user.id))
        return forbiddenError("You cannot update pumps in this organisation")(res);

      pump.set("name", name);

      await pump.save();

      ok(pump)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
