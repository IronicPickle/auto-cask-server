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
import { OrganisationsPumpsCreate } from "@shared/ts/api/organisations";
import { Organisation } from "@mongoose/schemas/Organisation";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import { PumpClient } from "@mongoose/schemas/PumpClient";
import { sockSend } from "@src/zmq/setupZmq";
import { ZmqRequestType } from "@shared/enums/zmq";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.post<OrganisationsPumpsCreate>("/:organisationId/pumps", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId } = req.params;
    const { mac, name } = req.body;

    const validators = organisationValidators.pumpsCreate({ ...req.params, ...req.body });

    const organisation = await Organisation.findById(organisationId);

    if (!organisation) return notFoundError("No organisation exists with that id")(res);

    const preExistingPump = await OrganisationPump.findOne({
      organisation: organisationId,
      name,
    });

    validators.name.custom(() =>
      preExistingPump ? "A pump already exists with that name" : undefined,
    );

    const validation = parseValidators(validators);

    if (validation.failed || !organisationId || !name || !mac)
      return validationError(validation)(res);

    const pumpClient = await PumpClient.findOne({ mac });

    if (!pumpClient)
      return badRequestError("That mac address does not match any pump clients")(res);

    if (!pumpClient.fingerprintedUsers.includes(req.user.id))
      return badRequestError("You haven't been associated with that pump client.")(res);

    const preExistingPumpViaMac = await OrganisationPump.findOne({ pumpClient: pumpClient._id });

    if (preExistingPumpViaMac)
      return conflictError("That pump client has already been associated with another pump")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(organisationId);

    if (!permissionChecker.canCreatePumps(req.user.id))
      return forbiddenError("You cannot create pumps in this organisation")(res);

    const { _id } = await OrganisationPump.create({
      organisation: organisationId,
      pumpClient: pumpClient._id,
      mac,
      name,
    });

    const pump = await OrganisationPump.findById(_id).populate([
      {
        path: "organisation",
        select: "name createdOn",
      },
      {
        path: "pumpClient",
        select: "mac fingerprintedUsers createdOn",
      },
    ]);

    await sockSend(pumpClient.publicKey, ZmqRequestType.PumpAssociated);

    ok(pump)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
