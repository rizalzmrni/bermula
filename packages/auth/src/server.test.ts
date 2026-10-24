import type { Db } from "@bermula/db/client";
import { describe, expect, it, vi } from "vitest";

import { createFakeLogger } from "./fake-logger";
import { createAuth } from "./server";
import type { AuthEmailSenders } from "./server";

const ENV = {
  APP_URL: "http://localhost:5173",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-chars",
  BETTER_AUTH_URL: "http://localhost:8787",
  CORS_ORIGINS: ["http://localhost:5173", "http://localhost:5174"],
  WEB_URL: "http://localhost:5174",
};

const USER = {
  createdAt: new Date("2026-01-01T00:00:00Z"),
  email: "budi@example.com",
  emailVerified: false,
  id: "user-1",
  name: "Budi",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const setup = (emails: Partial<AuthEmailSenders> = {}) => {
  const pending: Promise<unknown>[] = [];
  const logger = createFakeLogger();
  const senders: AuthEmailSenders = {
    sendOrganizationInvitationEmail: vi.fn<() => Promise<void>>(() =>
      Promise.resolve()
    ),
    sendResetPasswordEmail: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    sendVerificationEmail: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    ...emails,
  };
  const auth = createAuth({
    // Opsi dibaca tanpa query; adapter baru menyentuh DB saat request.
    db: {} as Db,
    emails: senders,
    env: ENV,
    logger,
    waitUntil: (promise) => {
      pending.push(promise);
    },
  });

  return { auth, logger, pending, senders };
};

describe(createAuth, () => {
  it("requires verified email and disables the in-memory rate limiter", () => {
    const { auth } = setup();

    expect(auth.options.emailAndPassword.requireEmailVerification).toBeTruthy();
    expect(auth.options.rateLimit.enabled).toBeFalsy();
    expect(auth.options.trustedOrigins).toStrictEqual([
      "http://localhost:5173",
      "http://localhost:5174",
    ]);
    expect(auth.options.plugins.map((plugin) => plugin.id)).toContain(
      "organization"
    );
  });

  it("marks personal organizations as server-only and undeletable", async () => {
    const { auth } = setup();
    const organizationPlugin = auth.options.plugins.find(
      (plugin) => plugin.id === "organization"
    );
    const beforeDelete =
      organizationPlugin?.options?.organizationHooks?.beforeDeleteOrganization;
    const organization = {
      createdAt: new Date("2026-01-01T00:00:00Z"),
      id: "org-1",
      name: "Budi",
      slug: "personal-user-1",
    };

    expect(
      organizationPlugin?.options?.schema?.organization?.additionalFields
        ?.isPersonal
    ).toMatchObject({ input: false, type: "boolean" });
    await expect(
      beforeDelete?.({
        organization: { ...organization, isPersonal: true },
        user: USER,
      })
    ).rejects.toThrow("Personal organization cannot be deleted");
    await expect(
      beforeDelete?.({
        organization: { ...organization, isPersonal: false },
        user: USER,
      })
    ).resolves.toBeUndefined();
  });

  it("sends the reset password email in the background", async () => {
    const { auth, pending, senders } = setup();

    await auth.options.emailAndPassword.sendResetPassword({
      token: "token",
      url: "http://localhost:8787/reset",
      user: USER,
    });
    await Promise.all(pending);

    expect(pending).toHaveLength(1);
    expect(senders.sendResetPasswordEmail).toHaveBeenCalledWith({
      name: "Budi",
      to: "budi@example.com",
      url: "http://localhost:8787/reset",
    });
  });

  it("logs a failed email instead of rejecting the background task", async () => {
    const failure = new Error("Resend is down");
    const { auth, logger, pending } = setup({
      sendVerificationEmail: () => Promise.reject(failure),
    });

    await auth.options.emailVerification.sendVerificationEmail({
      token: "token",
      url: "http://localhost:8787/verify",
      user: USER,
    });
    await Promise.all(pending);

    expect(logger.error).toHaveBeenCalledWith("Failed to send auth email", {
      error: failure,
      task: "verify-email",
    });
  });
});
