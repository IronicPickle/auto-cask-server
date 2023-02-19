import { RequestHandler, Router } from "express";
import { RequestDetails } from "../../../../auto-cask-shared/ts/api/generic";

type Handlers<R extends RequestDetails> = Array<
  RequestHandler<R["params"], R["res"], Partial<R["body"]>, Partial<R["query"]>>
>;

export default class WrappedRouter {
  public router: Router;

  constructor() {
    this.router = Router();
  }

  use<R extends RequestDetails>(
    method: "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head",
    path: string,
    ...handlers: Handlers<R>
  ) {
    this.router[method](path, ...handlers);
  }

  all<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.all(path, ...handlers);
  }

  get<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.get(path, ...handlers);
  }

  post<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.post(path, ...handlers);
  }

  put<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.put(path, ...handlers);
  }

  delete<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.delete(path, ...handlers);
  }

  patch<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.patch(path, ...handlers);
  }

  options<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.options(path, ...handlers);
  }

  head<R extends RequestDetails>(path: string, ...handlers: Handlers<R>) {
    this.router.head(path, ...handlers);
  }
}
