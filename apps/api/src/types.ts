import type { Auth, Session } from "@bermula/auth/server";
import type { Db } from "@bermula/db/client";
import type { ApiEnv } from "@bermula/env/api";
import type { Logger } from "@bermula/observability/logger";
import type { CaptureException } from "@bermula/observability/posthog";
import type { PaymentGateway } from "@bermula/payments/gateway";
import type { ObjectStorage } from "@bermula/storage/object-storage";

import type { ActiveMembership } from "./services/account";
import type { OrganizationMembership } from "./services/organizations";

/** Binding Worker (`c.env`), dihasilkan `wrangler types` dari `wrangler.jsonc`. */
export type Bindings = Env;

/** Layanan per request yang disiapkan `contextMiddleware`. */
export interface AppVariables {
  env: ApiEnv;
  logger: Logger;
  db: Db;
  auth: Auth;
  storage: ObjectStorage;
  /** `undefined` bila PostHog belum dikonfigurasi. */
  captureException: CaptureException | undefined;
  /** `undefined` bila Polar belum dikonfigurasi; endpoint billing membalas 503. */
  payments: PaymentGateway | undefined;
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
    /** Organisasi aktif + role pengguna, sudah dicek ke tabel anggota. */
    membership: ActiveMembership;
  };
}

/** Tambahan context setelah `requireUser`: sesi pasti ada, tanpa organisasi. */
export interface UserEnv {
  Bindings: Bindings;
  Variables: AppVariables & {
    user: Session["user"];
    session: Session["session"];
  };
}

/**
 * Tambahan context setelah `requireOrganizationMember`: organisasi dari path
 * `{organizationId}`, bukan dari sesi, sudah dicek ke tabel anggota.
 */
export interface OrganizationEnv {
  Bindings: Bindings;
  Variables: UserEnv["Variables"] & {
    organizationId: string;
    membership: OrganizationMembership;
  };
}
