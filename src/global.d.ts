import { User } from "@mongoose/schemas/User";
import { HydratedDocumentFromSchema } from "mongoose";

type ExpressUser = HydratedDocumentFromSchema<typeof User.schema>;

interface Test {
  test: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SESSION_SECRET?: string;
      SECRET_KEY?: string;
      PUBLIC_KEY?: string;
    }
  }

  namespace Express {
    interface Request {
      user?: ExpressUser;
      expiredUser?: ExpressUser;
    }
  }
}

export {};
