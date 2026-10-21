import type { ApiEnv } from "@bermula/env/api";
import type { Logger } from "@bermula/observability/logger";
import type { BetterAuthOptions } from "better-auth";

/** Subset env api yang dibaca konfigurasi auth. */
export type AuthEnv = Pick<
  ApiEnv,
  | "APP_URL"
  | "AUTH_COOKIE_DOMAIN"
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "CORS_ORIGINS"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "WEB_URL"
>;

/** Route di apps/app yang menerima undangan organisasi (dibuat di Fase 4). */
export const ACCEPT_INVITATION_PATH = "/accept-invitation";

/**
 * Origin yang boleh memicu request auth (CSRF) dan menjadi tujuan
 * `callbackURL`/`redirectTo`. Diambil dari env agar tidak ada domain hardcode.
 */
export const buildTrustedOrigins = (
  env: Pick<AuthEnv, "APP_URL" | "CORS_ORIGINS" | "WEB_URL">
): string[] => [...new Set([env.APP_URL, env.WEB_URL, ...env.CORS_ORIGINS])];

export const buildInvitationUrl = ({
  appUrl,
  invitationId,
}: {
  appUrl: string;
  invitationId: string;
}): string =>
  `${appUrl}${ACCEPT_INVITATION_PATH}/${encodeURIComponent(invitationId)}`;

/** Google hanya aktif bila kedua kredensial diisi (pasangan divalidasi env). */
export const buildSocialProviders = (
  env: Pick<AuthEnv, "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET">
): NonNullable<BetterAuthOptions["socialProviders"]> => {
  if (!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)) {
    return {};
  }

  return {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Selalu tampilkan pemilih akun agar pengguna dengan beberapa akun
      // Google tidak otomatis masuk dengan akun yang salah.
      prompt: "select_account",
    },
  };
};

/**
 * App dan api berbeda subdomain di production, jadi cookie sesi harus
 * ditulis ke domain induk. Di localhost (port berbeda, host sama) tidak perlu.
 */
export const buildCrossSubDomainCookies = (
  env: Pick<AuthEnv, "AUTH_COOKIE_DOMAIN">
): NonNullable<BetterAuthOptions["advanced"]>["crossSubDomainCookies"] =>
  env.AUTH_COOKIE_DOMAIN
    ? { domain: env.AUTH_COOKIE_DOMAIN, enabled: true }
    : undefined;

/** Teruskan log internal better-auth ke logger proyek (Workers Logs + BetterStack). */
export const toAuthLogger = (
  logger: Logger
): NonNullable<BetterAuthOptions["logger"]> => ({
  // Penyaringan level dilakukan logger proyek (`LOG_LEVEL`), bukan better-auth.
  level: "debug",
  log: (level, message, ...args: unknown[]) => {
    logger[level](message, args.length > 0 ? { args } : undefined);
  },
});
