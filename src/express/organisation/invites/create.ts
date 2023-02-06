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
import {
  OrganisationInvitesCreateReq,
  OrganisationInvitesCreateRes,
} from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionChecker from "@shared/permissionCheckers/organisationPermissionChecker";
import { User } from "@mongoose/schemas/User";
import { OrganisationInvite } from "@mongoose/schemas/OrganisationInvite";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";

const router = Router();

router.post<"/create", {}, OrganisationInvitesCreateRes, Partial<OrganisationInvitesCreateReq>>(
  "/create",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId, userId } = req.body;

      const validators = organisationValidators.invitesCreate(req.body);

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId || !userId) return validationError(validation)(res);

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) return notFoundError("No organisation exists with that id")(res);

      const user = await User.findById(userId);

      if (!user) return notFoundError("No user exists with that id")(res);

      const preExistingInvite = await OrganisationInvite.findOne({
        user: userId,
      });

      if (preExistingInvite)
        return notFoundError("That user has already been invited to this organisation")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.canCreateInvites(req.user.id))
        return forbiddenError("You cannot create invites in this organisation")(res);

      if (permissionChecker.isMember(userId))
        return badRequestError("That user is already a member of this organisation")(res);

      if (permissionChecker.isOwner(userId))
        return badRequestError("An owner cannot have their role modified")(res);

      const { _id } = await OrganisationInvite.create({
        organisation: organisationId,
        user: userId,
      });

      const invite = await OrganisationInvite.findById(_id).populate([
        {
          path: "user",
          select: "displayName createdOn",
        },
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
