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
import { OrganisationLeaveReq, OrganisationLeaveRes } from "@shared/ts/api/organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";

const router = Router();

router.delete<"/leave", {}, OrganisationLeaveRes, {}, Partial<OrganisationLeaveReq>>(
  "/leave",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId } = req.query;

      const validators = organisationValidators.leave(req.query);

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId) return validationError(validation)(res);

      const organisationMember = await OrganisationMember.findOne({
        organisation: organisationId,
        user: req.user._id,
      });

      if (!organisationMember) return notFoundError("No organisation exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.isMember(req.user.id))
        return forbiddenError("You are not a member of this organisation")(res);

      if (permissionChecker.isOwner(req.user.id))
        return forbiddenError("You cannot leave an organisation you own")(res);

      await organisationMember.delete();

      ok(organisationMember)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
