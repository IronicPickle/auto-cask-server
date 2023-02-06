import { isDev } from "@config/config";

export const log = (...text: any[]) => {
  if (isDev) console.log("[Development]", ...text);
};
