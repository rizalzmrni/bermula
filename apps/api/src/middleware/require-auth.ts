import { createMiddleware } from "hono/factory";

import { ApiError } from "../lib/errors";
import { getActiveMembership } from "../services/account";
import type { AuthenticatedEnv } from "../types";

/**
 * Wajib login dan masih anggota organisasi aktif. Menaruh `user`, `session`,
 * `organizationId`, dan `membership` (termasuk role) di context; service
 * menerima nilainya sebagai parameter eksplisit untuk men-scope data.
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

    // Dicek ulang ke DB: pengguna bisa dikeluarkan setelah sesinya dibuat.
    const membership = await getActiveMembership({
      db: c.var.db,
      organizationId,
      userId: result.user.id,
    });

    c.set("user", result.user);
    c.set("session", result.session);
    c.set("organizationId", organizationId);
    c.set("membership", membership);
    return next();
  }
);
