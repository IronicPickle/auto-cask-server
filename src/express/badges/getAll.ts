import WrappedRouter from "@lib/utils/WrappedRouter";
import { Badge } from "@mongoose/schemas/Badge";
import { BadgesGetAll } from "@shared/ts/api/badges";
import { error, ok, unauthorizedError } from "@shared/utils/api";

const router = new WrappedRouter();

router.get<BadgesGetAll>("/", async (req, res) => {
  try {
    if (!req.user) return unauthorizedError()(res);

    const badges = await Badge.find().populate([
      {
        path: "createdBy",
        select: "displayName createdOn",
      },
    ]);

    ok(badges)(res);
  } catch (err) {
    console.error(err);
    error("Something went wrong.")(res);
  }
});

export default router.router;
