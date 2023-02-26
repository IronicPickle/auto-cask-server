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
import { OrganisationsPumpsBadgeUpdate } from "@shared/ts/api/organisations";
import OrganisationPermissionCheckerBE from "@lib/utils/PermissionCheckerBE";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { sockSend } from "@src/zmq/setupZmq";
import { ZmqRequestType } from "@src/../../auto-cask-shared/enums/zmq";

const router = new WrappedRouter();

router.patch<OrganisationsPumpsBadgeUpdate>(
  "/:organisationId/pumps/:pumpId/badge",
  async (req, res) => {
    try {
      if (!req.user) return unauthorizedError()(res);

      const { pumpId, organisationId } = req.params;
      const { badgeId } = req.body;

      const validators = organisationValidators.pumpsBadgeUpdate({ ...req.params, ...req.body });

      const validation = parseValidators(validators);

      if (validation.failed || !pumpId || !organisationId || !badgeId)
        return validationError(validation)(res);

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
        {
          path: "badge",
          select: "name breweryName createdBy createdOn",
        },
      ]);

      if (!pump) return notFoundError("No pump exists with that id")(res);

      const badge = await Badge.findById(badgeId);

      if (!badge) return notFoundError("No badge exists with that id")(res);

      const permissionChecker = await OrganisationPermissionCheckerBE.from(pump.organisation.id);

      if (!permissionChecker.canUpdatePumpsBadge(req.user.id))
        return forbiddenError("You cannot update pumps in this organisation")(res);

      pump.set("badge", badgeId);

      await pump.save();

      await sockSend((pump.pumpClient as any).publicKey, ZmqRequestType.BadgeData, badge);

      (pump.pumpClient as any).publicKey = undefined;

      ok(pump)(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router.router;
