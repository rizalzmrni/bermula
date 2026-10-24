import { createMiddleware } from "hono/factory";

import { ApiError } from "../lib/errors";
import type { AuthenticatedEnv } from "../types";

/**
 * Wajib login. Menaruh `user`, `session`, dan `organizationId` (organisasi
 * aktif) di context; service menerima keduanya sebagai parameter eksplisit
 * untuk men-scope data.
 */
export const requireAuth = createMiddleware<AuthenticatedEnv>(
  async (c, next) => {
    const result = await c.var.auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!result) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Silakan masuk terlebih dahulu.",
        status: 401,
      });
    }

    // Hook sesi di packages/auth selalu mengisi organisasi aktif; kosong
    // berarti organisasi itu sudah dihapus (FK `set null`).
    const organizationId = result.session.activeOrganizationId;
    if (!organizationId) {
      throw new ApiError({
        code: "NO_ACTIVE_ORGANIZATION",
        message: "Pilih organisasi terlebih dahulu.",
        status: 403,
      });
    }

    c.set("user", result.user);
    c.set("session", result.session);
    c.set("organizationId", organizationId);
    return next();
  }
);
