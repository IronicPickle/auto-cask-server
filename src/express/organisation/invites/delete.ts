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
  OrganisationInvitesDeleteReq,
  OrganisationInvitesDeleteRes,
} from "@shared/ts/api/organisation";
import OrganisationPermissionChecker from "@shared/permissionCheckers/organisationPermissionChecker";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";

const router = Router();

router.delete<"/delete", {}, OrganisationInvitesDeleteRes, Partial<OrganisationInvitesDeleteReq>>(
  "/delete",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { inviteId } = req.body;

      const validators = organisationValidators.invitesDelete(req.body);

      let validation = parseValidators(validators);
      if (validation.failed || !inviteId) return validationError(validation)(res);

      const invite = await OrganisationInvite.findById(inviteId).populate([
        {
          path: "user",
          select: "displayName createdOn",
        },
        {
          path: "organisation",
          select: "name createdOn",
        },
      ]);

      if (!invite) return notFoundError("No invite exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(invite.organisation.id);

      if (!permissionChecker.canDeleteInvites(req.user.id))
        return forbiddenError("You cannot delete invites in this organisation")(res);

      await invite.delete();

      ok(invite)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
