import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { BadgesUpdate } from "@shared/ts/api/badges";
import {
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import badgeValidators from "@shared/validators/badgeValidators";
import { parseValidators } from "@shared/utils/generic";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import { PumpClient } from "@mongoose/schemas/PumpClient";
import { sockSend } from "@src/zmq/setupZmq";
import { ZmqRequestType } from "@shared/enums/zmq";

const router = new WrappedRouter();

router.patch<BadgesUpdate>("/:badgeId", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { badgeId } = req.params;
    const { name, breweryName } = req.body;

    const validators = badgeValidators.update({ ...req.params, ...req.body });

    const validation = parseValidators(validators);

    if (validation.failed || !badgeId || !name || !breweryName)
      return validationError(validation)(res);

    const badge = await Badge.findById(badgeId).populate([
      {
        path: "createdBy",
        select: "displayName createdOn",
      },
    ]);

    if (!badge) return notFoundError("No badge exists with that id")(res);

    if (!badge.createdBy._id.equals(req.user._id))
      return forbiddenError("You are not the creator of this badge")(res);

    badge.set("name", name);
    badge.set("breweryName", breweryName);

    await badge.save();

    ok(badge)(res);

    const pumps = await OrganisationPump.find({
      badge: badge._id,
    });
    const pumpClientIds = pumps.map(({ pumpClient }) => pumpClient._id);

    const pumpClients = await PumpClient.find({
      _id: {
        $in: pumpClientIds,
      },
    });

    for (const { publicKey } of pumpClients) {
      sockSend(publicKey, ZmqRequestType.BadgeData, badge);
    }
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
