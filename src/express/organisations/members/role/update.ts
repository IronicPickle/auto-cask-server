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
import { OrganisationsMembersRoleUpdate } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.patch<OrganisationsMembersRoleUpdate>(
  "/:organisationId/members/:userId/role",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId, userId } = req.params;
      const { role } = req.body;

      const validators = organisationValidators.membersUpdateRole({ ...req.params, ...req.body });

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId || !userId || !role)
        return validationError(validation)(res);

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

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.canModifyRoles(req.user.id))
        return forbiddenError("You cannot modify roles in this organisation")(res);

      if (permissionChecker.hasRole(role, userId))
        return badRequestError("That user already has that role")(res);

      if (permissionChecker.isOwner(userId))
        return badRequestError("An owner cannot have their role modified")(res);

      member.set("role", role);

      await member.save();

      ok(member)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router.router;
