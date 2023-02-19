import { Router } from "express";
import pumpClientValidators from "@shared/validators/pumpClientValidators";
import { parseValidators } from "@shared/utils/generic";
import { conflictError, error, ok, validationError } from "@shared/utils/api";
import { PumpClientSetupReq, PumpClientSetupRes } from "@shared/ts/api/pumpClients";
import { PumpClient } from "@mongoose/schemas/PumpClient";
import { hashSync } from "bcryptjs";
import { curveKeyPair } from "zeromq";

const router = Router();

router.post<"/setup", {}, PumpClientSetupRes, Partial<PumpClientSetupReq>>(
  "/setup",
  async (req, res) => {
    try {
      const { mac } = req.body;

      const validators = pumpClientValidators.setup(req.body);

      const validation = parseValidators(validators);

      if (validation.failed || !mac) return validationError(validation)(res);

      const preExistingPumpClient = await PumpClient.findOne({ mac });

      if (preExistingPumpClient)
        return conflictError("That mac address has already been setup.")(res);

      const { publicKey, secretKey } = curveKeyPair();

      const pumpClient = await PumpClient.create({
        mac,
        publicKey,
      });

      ok({
        _id: pumpClient.id,
        mac: pumpClient.mac,
        createdOn: pumpClient.createdOn,
        publicKey,
        secretKey,
        serverPublicKey: process.env.PUBLIC_KEY,
      })(res);
    } catch (err) {
      console.error(err);
      error("Something went wrong.")(res);
    }
  },
);

export default router;
