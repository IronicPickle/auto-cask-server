import organisationValidators from "@shared/validators/organisationValidators";
import { parseValidators } from "@shared/utils/generic";
import {
  conflictError,
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import { OrganisationsInvitesCreate } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.post<OrganisationsInvitesCreate>("/:organisationId/invites", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId } = req.params;
    const { email } = req.body;

    const validators = organisationValidators.invitesCreate({ ...req.params, ...req.body });

    let validation = parseValidators(validators);
    if (validation.failed || !organisationId || !email) return validationError(validation)(res);

    const organisation = await Organisation.findById(organisationId);

    if (!organisation) return notFoundError("No organisation exists with that id")(res);

    const preExistingInvite = await OrganisationInvite.findOne({
      email,
    });

    if (preExistingInvite)
      return conflictError("That user has already been invited to this organisation")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

    if (!permissionChecker.canCreateInvites(req.user.id))
      return forbiddenError("You cannot create invites in this organisation")(res);

    if (permissionChecker.isMember(email))
      return conflictError("That user is already a member of this organisation")(res);

    const { _id } = await OrganisationInvite.create({
      organisation: organisationId,
      email,
    });

    const invite = await OrganisationInvite.findById(_id).populate([
      {
        path: "organisation",
        select: "name createdOn",
      },
    ]);

    if (!invite) throw Error("Something went wrong");

    ok(invite)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
