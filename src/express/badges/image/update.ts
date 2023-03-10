import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { BadgesImageUpdate } from "@shared/ts/api/badges";
import {
  badRequestError,
  error,
  forbiddenError,
  notFoundError,
  ok,
  unauthorizedError,
  validationError,
} from "@shared/utils/api";
import badgeValidators from "@shared/validators/badgeValidators";
import { parseValidators } from "@shared/utils/generic";
import { parseForm } from "@lib/utils/generic";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { OrganisationPump } from "@mongoose/schemas/OrganisationPump";
import { PumpClient } from "@mongoose/schemas/PumpClient";
import { sockSend } from "@src/zmq/setupZmq";
import { ZmqRequestType } from "@shared/enums/zmq";

const router = new WrappedRouter();

router.put<BadgesImageUpdate>("/:badgeId/image", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const { badgeId } = req.params;

    const validators = badgeValidators.updateImage(req.params);

    const validation = parseValidators(validators);

    if (validation.failed || !badgeId) return validationError(validation)(res);

    const { files } = await parseForm(req);

    if (!files) return badRequestError("Could not parse image file")(res);

    const [image] = files.image;

    const maxSize = 1024 * 1024 * 50; // ~50mb
    if (image.size > maxSize) return badRequestError("File size must not exceed 50mb")(res);

    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(image.mimetype ?? ""))
      return badRequestError(
        `File type not allowed, permitted file types: ${allowedTypes.join(", ")}`,
      )(res);

    const badge = await Badge.findById(badgeId).populate([
      {
        path: "createdBy",
        select: "displayName createdOn",
      },
    ]);

    if (!badge) return notFoundError("No badge exists with that id")(res);

    if (!badge.createdBy._id.equals(req.user._id))
      return forbiddenError("You are not the creator of this badge")(res);

    const dirPath = `public/images/badges/${badge.id}`;
    const newPath = path.join(dirPath, "badge.jpg");

    const file = await Jimp.read(image.filepath);
    fs.rmSync(image.filepath);

    fs.mkdirSync(dirPath, {
      recursive: true,
    });

    const aspectRatio = file.getWidth() / file.getHeight();
    await file
      .resize(500, 500 / aspectRatio)
      .quality(60)
      .background(0xffffffff)
      .writeAsync(newPath);

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
