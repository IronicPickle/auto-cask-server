import { Router } from "express";
import organisationValidators from "@shared/validators/organisationValidators";
import { parseValidators } from "@shared/utils/generic";
import {
  badRequestError,
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import { OrganisationsMembersRemove } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.delete<OrganisationsMembersRemove>("/:organisationId/members/:userId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId, userId } = req.params;

    const validators = organisationValidators.membersRemove(req.params);

    let validation = parseValidators(validators);
    if (validation.failed || !organisationId || !userId) return validationError(validation)(res);

    const organisation = await Organisation.findById(organisationId);

    if (!organisation) return notFoundError("No organisation exists with that id")(res);

    const member = await OrganisationMember.findOne(
      {
        user: userId,
        organisation: organisationId,
      },
      "organisation user role joinedOn",
    ).populate([
      {
        path: "user",
        select: "displayName createdOn",
      },
      {
        path: "organisation",
        select: "name createdOn",
      },
    ]);

    if (!member) return badRequestError("That user is not a member of this organisation")(res);

    if (req.user._id.equals(userId)) return badRequestError("You cannot remove yourself")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

    if (!permissionChecker.canRemoveMember(req.user.id, userId))
      return forbiddenError("You cannot remove that member from this organisation")(res);

    await member.delete();

    ok(member)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
