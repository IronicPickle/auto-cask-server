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
import { OrganisationsMembersGet } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<OrganisationsMembersGet>("/:organisationId/members/:userId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId, userId } = req.params;

    const validators = organisationValidators.membersGet(req.params);

    let validation = parseValidators(validators);
    if (validation.failed || !organisationId || !userId) return validationError(validation)(res);

    const organisation = await Organisation.findById(organisationId);

    if (!organisation) return notFoundError("No organisation exists with that id")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

    if (!permissionChecker.canViewMembers(req.user.id))
      return forbiddenError("You cannot view the members of this organisation")(res);

    const member = await OrganisationMember.findOne(
      {
        organisation: organisationId,
        user: userId,
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

    ok(member)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
