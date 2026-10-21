import type { Db } from "@bermula/db/client";
import type { Logger } from "@bermula/observability/logger";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins/organization";

import {
  buildCrossSubDomainCookies,
  buildInvitationUrl,
  buildSocialProviders,
  buildTrustedOrigins,
  toAuthLogger,
} from "./config";
import type { AuthEnv } from "./config";

const SECONDS_PER_DAY = 60 * 60 * 24;
const SESSION_EXPIRES_IN = 7 * SECONDS_PER_DAY;
const SESSION_UPDATE_AGE = SECONDS_PER_DAY;
// Loader apps/app mengecek sesi di setiap navigasi; cache di cookie menghemat
// query DB, dengan harga sesi yang dicabut baru tidak berlaku setelah ≤5 menit.
const SESSION_COOKIE_CACHE_MAX_AGE = 5 * 60;
const INVITATION_EXPIRES_IN = 2 * SECONDS_PER_DAY;

interface UserEmailInput {
  to: string;
  name: string;
  url: string;
}

/**
 * Pengiriman email disuntikkan oleh apps/api (yang memanggil `packages/email`),
 * sehingga paket ini tidak bergantung pada penyedia email.
 */
export interface AuthEmailSenders {
  sendVerificationEmail: (input: UserEmailInput) => Promise<void>;
  sendResetPasswordEmail: (input: UserEmailInput) => Promise<void>;
  sendOrganizationInvitationEmail: (input: {
    to: string;
    inviterName: string;
    organizationName: string;
    url: string;
  }) => Promise<void>;
}

export interface CreateAuthOptions {
  /** Klien `createDb` (neon-http); adapter berjalan tanpa transaksi. */
  db: Db;
  env: AuthEnv;
  emails: AuthEmailSenders;
  logger: Logger;
  /** `c.executionCtx.waitUntil` dari Hono, agar tugas latar tidak terpotong. */
  waitUntil: (promise: Promise<unknown>) => void;
}

/**
 * Di Workers, env dan `waitUntil` baru ada saat request, jadi instance dibuat
 * per request (di middleware apps/api), bukan di variabel modul.
 */
export const createAuth = ({
  db,
  emails,
  env,
  logger,
  waitUntil,
}: CreateAuthOptions) => {
  // Email dikirim di latar: respons tidak menunggu penyedia email, dan waktu
  // respons tidak membocorkan apakah sebuah email terdaftar.
  const sendSafely = async (task: string, send: () => Promise<void>) => {
    try {
      await send();
    } catch (error) {
      logger.error("Failed to send auth email", { error, task });
    }
  };

  const sendInBackground = (task: string, send: () => Promise<void>) => {
    waitUntil(sendSafely(task, send));
    return Promise.resolve();
  };

  return betterAuth({
    account: {
      // Default better-auth sudah aman: penautan otomatis hanya bila email
      // terverifikasi di kedua sisi. Ditulis eksplisit agar mudah ditinjau.
      accountLinking: { enabled: true },
    },
    advanced: {
      backgroundTasks: { handler: waitUntil },
      crossSubDomainCookies: buildCrossSubDomainCookies(env),
      database: { generateId: "uuid" },
      // Di belakang Cloudflare hanya header ini yang tidak bisa dipalsukan
      // klien; `x-forwarded-for` bisa diisi bebas oleh penyerang.
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ url, user }) =>
        sendInBackground("reset-password", () =>
          emails.sendResetPasswordEmail({
            name: user.name,
            to: user.email,
            url,
          })
        ),
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendOnSignUp: true,
      sendVerificationEmail: ({ url, user }) =>
        sendInBackground("verify-email", () =>
          emails.sendVerificationEmail({ name: user.name, to: user.email, url })
        ),
    },
    logger: toAuthLogger(logger),
    plugins: [
      organization({
        invitationExpiresIn: INVITATION_EXPIRES_IN,
        requireEmailVerificationOnInvitation: true,
        sendInvitationEmail: ({ email, id, inviter, organization: org }) =>
          sendInBackground("organization-invitation", () =>
            emails.sendOrganizationInvitationEmail({
              inviterName: inviter.user.name,
              organizationName: org.name,
              to: email,
              url: buildInvitationUrl({
                appUrl: env.APP_URL,
                invitationId: id,
              }),
            })
          ),
      }),
    ],
    // Limiter bawaan menyimpan hitungan di memori isolate, yang tidak berlaku
    // di Workers. `/api/auth/*` dibatasi binding Rate Limiting di apps/api.
    rateLimit: { enabled: false },
    secret: env.BETTER_AUTH_SECRET,
    session: {
      cookieCache: { enabled: true, maxAge: SESSION_COOKIE_CACHE_MAX_AGE },
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
    },
    socialProviders: buildSocialProviders(env),
    telemetry: { enabled: false },
    trustedOrigins: buildTrustedOrigins(env),
  });
};

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
