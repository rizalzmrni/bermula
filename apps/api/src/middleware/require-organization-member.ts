import { createMiddleware } from "hono/factory";
import { z } from "zod";

import { ApiError } from "../lib/errors";
import { getOrganizationMembership } from "../services/organizations";
import type { OrganizationEnv } from "../types";
import { getSessionOrThrow } from "./require-user";

const organizationIdSchema = z.uuid();

/**
 * Wajib login dan anggota organisasi di path `{organizationId}`. Organisasi
 * diambil dari URL, bukan dari organisasi aktif di sesi, agar dua tab dengan
 * organisasi berbeda tidak saling menimpa. Keanggotaan selalu dicek ke DB.
 */
export const requireOrganizationMember = createMiddleware<OrganizationEnv>(
  async (c, next) => {
    const { session, user } = await getSessionOrThrow({
      auth: c.var.auth,
      headers: c.req.raw.headers,
    });

    const parsed = organizationIdSchema.safeParse(
      c.req.param("organizationId")
    );
    if (!parsed.success) {
      throw new ApiError({
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organisasi tidak ditemukan.",
        status: 404,
      });
    }

    const membership = await getOrganizationMembership({
      db: c.var.db,
      organizationId: parsed.data,
      userId: user.id,
    });

    c.set("user", user);
    c.set("session", session);
    c.set("organizationId", membership.id);
    c.set("membership", membership);
    return next();
  }
);
