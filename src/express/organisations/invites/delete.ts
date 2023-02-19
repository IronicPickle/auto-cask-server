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
import { OrganisationsInvitesDelete } from "@shared/ts/api/organisations";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.delete<OrganisationsInvitesDelete>(
  "/:organisationId/invites/:inviteId",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId, inviteId } = req.params;

      const validators = organisationValidators.invitesDelete(req.params);

      let validation = parseValidators(validators);
      if (validation.failed || !inviteId) return validationError(validation)(res);

      const invite = await OrganisationInvite.findOne({
        _id: inviteId,
        organisation: organisationId,
      }).populate([
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

export default router.router;
