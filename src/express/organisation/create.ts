import { Router } from "express";
import organisationValidators from "@shared/validators/organisationValidators";
import { parseValidators } from "@shared/utils/generic";
import { error, ok, unauthorizedError, validationError } from "@shared/utils/api";
import { OrganisationCreateReq, OrganisationCreateRes } from "@shared/ts/api/organisation";
import { Organisation } from "@mongoose/schemas/Organisation";
import { OrganisationRole } from "@shared/enums/api/generic";
import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";

const router = Router();

router.post<"/create", {}, OrganisationCreateRes, Partial<OrganisationCreateReq>>(
  "/create",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { name } = req.body;

      const validators = organisationValidators.create(req.body);
      const preExistingOrganisation = await Organisation.findOne({ name });

      validators.name.custom(() =>
        preExistingOrganisation ? "An organisation already exists with that name" : undefined,
      );

      const validation = parseValidators(validators);

      if (validation.failed || !name) return validationError(validation)(res);

      const { _id } = await Organisation.create({
        name,
        members: [
          {
            user: req.user.id,
            role: OrganisationRole.Owner,
          },
        ],
      });

      const organisation = await Organisation.findById(_id);

      if (!organisation) throw Error("Something went wrong");

      await OrganisationMember.create({
        organisation: organisation._id,
        user: req.user._id,
        role: OrganisationRole.Owner,
      });

      ok(organisation)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
