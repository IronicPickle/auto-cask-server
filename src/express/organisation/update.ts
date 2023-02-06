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
import { OrganisationUpdateReq, OrganisationUpdateRes } from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";

const router = Router();

router.patch<"/update", {}, OrganisationUpdateRes, Partial<OrganisationUpdateReq>>(
  "/update",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId, name } = req.body;

      const validators = organisationValidators.update(req.body);

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId || !name) return validationError(validation)(res);

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) return notFoundError("No organisation exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.canUpdate(req.user.id))
        return forbiddenError("You cannot update this organisation")(res);

      organisation.set("name", name);
      await organisation.save();

      ok(organisation)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
