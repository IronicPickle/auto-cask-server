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
import { OrganisationDeleteReq, OrganisationDeleteRes } from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";

const router = Router();

router.delete<"/delete", {}, OrganisationDeleteRes, {}, Partial<OrganisationDeleteReq>>(
  "/delete",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId } = req.query;

      const validators = organisationValidators.delete(req.query);

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId) return validationError(validation)(res);

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) return notFoundError("No organisation exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.canDelete(req.user.id))
        return forbiddenError("You cannot delete this organisation")(res);

      await OrganisationInvite.deleteMany({
        organisation: organisationId,
      });

      await OrganisationMember.deleteMany({
        organisation: organisationId,
      });

      await organisation.delete();

      ok(organisation)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
