import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";
import { validationHook } from "./errors";

/**
 * Router per domain. `defaultHook` dipasang di setiap router karena hook
 * validasi tidak diwariskan saat router di-mount dengan `app.route()`.
 */
export const createRouter = () =>
  new OpenAPIHono<AppEnv>({ defaultHook: validationHook });
