import { PumpClient } from "@mongoose/schemas/PumpClient";
import { Request } from "express";

export const checkIsAuthed = async (req: Request, mac?: string) => {
  const publicKey = req.header("Authorization")?.replace("Bearer ", "");

  if (!publicKey) return false;

  const pumpClient = await PumpClient.findOne({ mac });

  if (!pumpClient) return false;

  return publicKey === pumpClient.publicKey;
};
