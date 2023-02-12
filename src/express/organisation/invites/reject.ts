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
  OrganisationInvitesRejectReq,
  OrganisationInvitesRejectRes,
} from "@shared/ts/api/organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";

const router = Router();

router.delete<
  "/reject",
  {},
  OrganisationInvitesRejectRes,
  {},
  Partial<OrganisationInvitesRejectReq>
>("/reject", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { inviteId } = req.query;

    const validators = organisationValidators.invitesReject(req.query);

    let validation = parseValidators(validators);
    if (validation.failed || !inviteId) return validationError(validation)(res);

    const invite = await OrganisationInvite.findById(inviteId);

    if (!invite) return notFoundError("No invite exists with that id")(res);

    if (invite.email !== req.user.email)
      return forbiddenError("This invite is not addressed to you")(res);

    await invite.delete();

    ok()(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router;
