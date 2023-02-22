import { isDev } from "@config/config";
import { isArray } from "@src/../../auto-cask-shared/utils/generic";
import { Request } from "express";
import formidable, { File } from "formidable";

export const log = (...text: any[]) => {
  if (isDev) console.log("[Development]", ...text);
};

export const parseForm = (req: Request) =>
  new Promise<{ fields?: Record<string, string[]>; files?: Record<string, File[]> }>(resolve => {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
      if (err) return resolve({});
      resolve({
        fields: Object.entries(fields).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: isArray(value) ? value : [value],
          }),
          {},
        ),

        files: Object.entries(files).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: isArray(value) ? value : [value],
          }),
          {},
        ),
      });
    });
  });
