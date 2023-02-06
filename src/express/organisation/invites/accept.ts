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
  OrganisationInvitesAcceptReq,
  OrganisationInvitesAcceptRes,
} from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";

const router = Router();

router.post<"/accept", {}, OrganisationInvitesAcceptRes, Partial<OrganisationInvitesAcceptReq>>(
  "/accept",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { inviteId } = req.body;

      const validators = organisationValidators.invitesAccept(req.body);

      let validation = parseValidators(validators);
      if (validation.failed || !inviteId) return validationError(validation)(res);

      const invite = await OrganisationInvite.findById(inviteId);

      if (!invite) return notFoundError("No invite exists with that id")(res);

      if (!invite.user._id.equals(req.user._id))
        return forbiddenError("This invite is not addressed to you")(res);

      await invite.delete();

      await Organisation.findByIdAndUpdate(invite.organisation._id, {
        $push: {
          members: {
            user: invite.user._id,
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

export default router;
