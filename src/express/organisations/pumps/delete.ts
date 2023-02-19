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
import { OrganisationsPumpsDelete } from "@shared/ts/api/organisations";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import { sockSend } from "@src/zmq/setupZmq";
import { ZmqRequestType } from "@shared/enums/zmq";
import WrappedRouter from "@lib/utils/WrappedRouter";

const router = new WrappedRouter();

router.delete<OrganisationsPumpsDelete>("/:organisationId/pumps/:pumpId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { organisationId, pumpId } = req.params;

    const validators = organisationValidators.pumpsDelete(req.params);

    const validation = parseValidators(validators);

    if (validation.failed || !pumpId || !organisationId) return validationError(validation)(res);

    const pump = await OrganisationPump.findOne({
      _id: pumpId,
      organisation: organisationId,
    }).populate([
      {
        path: "organisation",
        select: "name createdOn",
      },
      {
        path: "pumpClient",
        select: "mac fingerprintedUsers createdOn publicKey",
      },
    ]);

    if (!pump) return notFoundError("No pump exists with that id")(res);

    const permissionChecker = await OrganisationPermissionCheckerBE.from(pump.organisation.id);

    if (!permissionChecker.canDeletePumps(req.user.id))
      return forbiddenError("You cannot delete pumps in this organisation")(res);

    await pump.delete();

    await sockSend((pump.pumpClient as any).publicKey, ZmqRequestType.PumpUnassociated);

    delete (pump.pumpClient as any).publicKey;

    ok(pump)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
