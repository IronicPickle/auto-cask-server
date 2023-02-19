import {
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import { OrganisationsInvitesGetAll } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import organisationValidators from "@shared/validators/organisationValidators";
import { parseValidators } from "@shared/utils/generic";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.get<OrganisationsInvitesGetAll>("/:organisationId/invites", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId } = req.params;

    const validators = organisationValidators.invitesGetAll(req.params);

    let validation = parseValidators(validators);
    if (validation.failed || !organisationId) return validationError(validation)(res);

    const currentOrganisation = await Organisation.findById(organisationId);

    if (!currentOrganisation) return notFoundError("No organisation exists with that id")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

    if (!permissionChecker.canViewInvites(req.user.id))
      return forbiddenError("You can't view the invites of this organisation")(res);

    const invites = await OrganisationInvite.find({
      organisation: organisationId,
    }).populate([
      {
        path: "organisation",
        select: "name createdOn",
      },
    ]);

    ok(invites)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
