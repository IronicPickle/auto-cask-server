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
import { OrganisationGetReq, OrganisationGetRes } from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";

const router = Router();

router.get<"/get", {}, OrganisationGetRes, Partial<OrganisationGetReq>>(
  "/get",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId } = req.body;

      const validators = organisationValidators.get(req.body);

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId) return validationError(validation)(res);

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) return notFoundError("No organisation exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.canView(req.user.id))
        return forbiddenError("You cannot view this organisation")(res);

      ok(organisation)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
