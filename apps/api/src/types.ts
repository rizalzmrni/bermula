import type { Auth, Session } from "@bermula/auth/server";
import type { Db } from "@bermula/db/client";
import type { ApiEnv } from "@bermula/env/api";
import type { Logger } from "@bermula/observability/logger";
import type { CaptureException } from "@bermula/observability/posthog";

/** Binding Worker (`c.env`), dihasilkan `wrangler types` dari `wrangler.jsonc`. */
export type Bindings = Env;

/** Layanan per request yang disiapkan `contextMiddleware`. */
export interface AppVariables {
  env: ApiEnv;
  logger: Logger;
  db: Db;
  auth: Auth;
  /** `undefined` bila PostHog belum dikonfigurasi. */
  captureException: CaptureException | undefined;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: AppVariables;
}

/** Tambahan context setelah `requireAuth`: sesi pasti ada dan ter-scope organisasi. */
export interface AuthenticatedEnv {
  Bindings: Bindings;
  Variables: AppVariables & {
    user: Session["user"];
    session: Session["session"];
    organizationId: string;
  };
}
