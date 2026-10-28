import type { Auth } from "@bermula/auth/server";
import { createMiddleware } from "hono/factory";

import { ApiError } from "../lib/errors";
import type { UserEnv } from "../types";

/** Sesi dari cookie, atau 401. Dipakai bersama `requireUser` dan `requireOrganizationMember`. */
export const getSessionOrThrow = async ({
  auth,
  headers,
}: {
  auth: Auth;
  headers: Headers;
}) => {
  const result = await auth.api.getSession({ headers });
  if (!result) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Silakan masuk terlebih dahulu.",
      status: 401,
    });
  }
  return result;
};

/**
 * Wajib login, tanpa syarat organisasi. Untuk data milik pengguna sendiri
 * (`/api/me/...`); service menerima `user.id` sebagai parameter eksplisit.
 */
export const requireUser = createMiddleware<UserEnv>(async (c, next) => {
  const { session, user } = await getSessionOrThrow({
    auth: c.var.auth,
    headers: c.req.raw.headers,
  });
  c.set("user", user);
  c.set("session", session);
  return next();
});
