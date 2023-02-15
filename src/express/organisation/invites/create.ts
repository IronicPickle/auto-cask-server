import { Router } from "express";
import organisationValidators from "@shared/validators/organisationValidators";
import { parseValidators } from "@shared/utils/generic";
import {
  badRequestError,
  conflictError,
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import {
  OrganisationInvitesCreateReq,
  OrganisationInvitesCreateRes,
} from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";

const router = Router();

router.post<"/create", {}, OrganisationInvitesCreateRes, Partial<OrganisationInvitesCreateReq>>(
  "/create",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId, email } = req.body;

      const validators = organisationValidators.invitesCreate(req.body);

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
  },
);

export default router;
