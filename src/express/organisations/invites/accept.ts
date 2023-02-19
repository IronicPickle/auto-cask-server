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
import { OrganisationsInvitesAccept } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.post<OrganisationsInvitesAccept>(
  "/:organisationId/invites/:inviteId/accept",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId, inviteId } = req.params;

      const validators = organisationValidators.invitesAccept(req.params);

      let validation = parseValidators(validators);
      if (validation.failed || !inviteId || !organisationId)
        return validationError(validation)(res);

      const invite = await OrganisationInvite.findOne({
        _id: inviteId,
        organisation: organisationId,
      });

      if (!invite) return notFoundError("No invite exists with that id")(res);

      if (invite.email !== req.user.email)
        return forbiddenError("This invite is not addressed to you")(res);

      await invite.delete();

      await Organisation.findByIdAndUpdate(invite.organisation._id, {
        $push: {
          members: {
            user: req.user._id,
          },
        },
      });

      await OrganisationMember.create({
        organisation: invite.organisation._id,
        user: req.user._id,
      });

      ok()(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router.router;
