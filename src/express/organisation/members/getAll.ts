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
  OrganisationMembersGetAllReq,
  OrganisationMembersGetAllRes,
} from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";

const router = Router();

router.get<"/getAll", {}, OrganisationMembersGetAllRes, Partial<OrganisationMembersGetAllReq>>(
  "/getAll",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { organisationId } = req.body;

      const validators = organisationValidators.membersGetAll(req.body);

      let validation = parseValidators(validators);
      if (validation.failed || !organisationId) return validationError(validation)(res);

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) return notFoundError("No organisation exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

      if (!permissionChecker.canViewMembers(req.user.id))
        return forbiddenError("You cannot view the members of this organisation")(res);

      const members = await OrganisationMember.find(
        {
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

      ok(members)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
