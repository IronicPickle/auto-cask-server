import config from "@config/config";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";

export const generateAccessToken = async (userId: string) =>
  generateToken(userId, dayjs().add(1, "day").unix());

export const generateRefreshToken = async (userId: string) =>
  generateToken(userId, dayjs().add(1, "year").unix());

const generateToken = (userId: string, exp: number) => {
  if (!config.sessionSecret)
    throw new Error("Critical error, auth session secret not present, cannot sign jwt tokens");

  return jwt.sign(
    {
      sub: userId,
      exp,
      iat: dayjs().unix(),
      nbf: dayjs().unix(),
    },
    config.sessionSecret,
  );
};
