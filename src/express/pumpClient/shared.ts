import { PumpClient } from "@mongoose/schemas/PumpClient";
import { compareSync } from "bcryptjs";
import { Request } from "express";

export const checkIsAuthed = async (req: Request, mac?: string) => {
  const accessToken = req.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) return false;

  const pumpClient = await PumpClient.findOne({ mac });

  if (!pumpClient) return false;

  return compareSync(accessToken, pumpClient.accessToken);
};
