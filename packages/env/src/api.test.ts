import { describe, expect, it } from "vitest";

import { createApiEnv } from "./api";

const VALID_ENV = {
  APP_URL: "http://localhost:5173",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-chars",
  BETTER_AUTH_URL: "http://localhost:8787",
  CORS_ORIGINS: "http://localhost:5173, http://localhost:5174",
  DATABASE_URL: "postgresql://user:pass@ep-test.neon.tech/app?sslmode=require",
  EMAIL_FROM: "Bermula <noreply@example.com>",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_BUCKET_NAME: "bermula-test",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  RESEND_API_KEY: "re_test_123",
  WEB_URL: "http://localhost:5174",
};

describe(createApiEnv, () => {
  it("parses valid env and splits CORS_ORIGINS into a list", () => {
    const env = createApiEnv(VALID_ENV);

    expect(env.APP_URL).toBe("http://localhost:5173");
    expect(env.CORS_ORIGINS).toStrictEqual([
      "http://localhost:5173",
      "http://localhost:5174",
    ]);
  });

  it("rejects an origin with a trailing slash or path", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, APP_URL: "http://localhost:5173/" })
    ).toThrow("APP_URL");
    expect(() =>
      createApiEnv({ ...VALID_ENV, WEB_URL: "https://example.com/app" })
    ).toThrow("WEB_URL");
  });

  it("treats an empty string as missing", () => {
    expect(() => createApiEnv({ ...VALID_ENV, CORS_ORIGINS: "" })).toThrow(
      "CORS_ORIGINS"
    );
  });

  it("rejects an invalid entry inside CORS_ORIGINS", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, CORS_ORIGINS: "http://localhost:5173,*" })
    ).toThrow("CORS_ORIGINS");
  });

  it("rejects a non-Postgres DATABASE_URL", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, DATABASE_URL: "mysql://localhost/app" })
    ).toThrow("DATABASE_URL");
  });

  it("defaults LOG_LEVEL to info and leaves integrations unset", () => {
    const env = createApiEnv(VALID_ENV);

    expect(env.LOG_LEVEL).toBe("info");
    expect(env.BETTER_STACK_SOURCE_TOKEN).toBeUndefined();
    expect(env.POSTHOG_PROJECT_TOKEN).toBeUndefined();
  });

  it("accepts a complete integration pair", () => {
    const env = createApiEnv({
      ...VALID_ENV,
      POSTHOG_HOST: "https://eu.i.posthog.com",
      POSTHOG_PROJECT_TOKEN: "phc_test",
    });

    expect(env.POSTHOG_HOST).toBe("https://eu.i.posthog.com");
  });

  it("requires both variables of an integration pair", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, BETTER_STACK_SOURCE_TOKEN: "token" })
    ).toThrow("BETTER_STACK_INGESTING_URL");
    expect(() =>
      createApiEnv({ ...VALID_ENV, POSTHOG_HOST: "https://eu.i.posthog.com" })
    ).toThrow("POSTHOG_PROJECT_TOKEN");
  });

  it("rejects a BETTER_AUTH_SECRET shorter than 32 characters", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, BETTER_AUTH_SECRET: "too-short" })
    ).toThrow("BETTER_AUTH_SECRET");
  });

  it("requires both Google OAuth credentials", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, GOOGLE_CLIENT_ID: "client-id" })
    ).toThrow("GOOGLE_CLIENT_SECRET");
  });

  it("requires both Stripe secrets and checks their prefixes", () => {
    const stripe = {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
    };

    expect(createApiEnv({ ...VALID_ENV, ...stripe }).STRIPE_SECRET_KEY).toBe(
      "sk_test_123"
    );
    expect(() =>
      createApiEnv({ ...VALID_ENV, STRIPE_SECRET_KEY: "sk_test_123" })
    ).toThrow("STRIPE_WEBHOOK_SECRET");
    // Publishable key (`pk_`) tertukar dengan secret key.
    expect(() =>
      createApiEnv({ ...VALID_ENV, ...stripe, STRIPE_SECRET_KEY: "pk_test_1" })
    ).toThrow("STRIPE_SECRET_KEY");
  });

  it("accepts a bare cookie domain and rejects a URL", () => {
    expect(
      createApiEnv({ ...VALID_ENV, AUTH_COOKIE_DOMAIN: "example.com" })
        .AUTH_COOKIE_DOMAIN
    ).toBe("example.com");
    expect(() =>
      createApiEnv({ ...VALID_ENV, AUTH_COOKIE_DOMAIN: "https://example.com" })
    ).toThrow("AUTH_COOKIE_DOMAIN");
  });

  it("accepts a bare or named EMAIL_FROM address", () => {
    expect(
      createApiEnv({ ...VALID_ENV, EMAIL_FROM: "noreply@example.com" })
        .EMAIL_FROM
    ).toBe("noreply@example.com");
    expect(() => createApiEnv({ ...VALID_ENV, EMAIL_FROM: "Bermula" })).toThrow(
      "EMAIL_FROM"
    );
  });

  it("rejects a RESEND_API_KEY without the re_ prefix", () => {
    expect(() =>
      createApiEnv({ ...VALID_ENV, RESEND_API_KEY: "sk_live_123" })
    ).toThrow("RESEND_API_KEY");
  });

  it("enables API docs only when API_DOCS_ENABLED is true", () => {
    expect(createApiEnv(VALID_ENV).API_DOCS_ENABLED).toBeFalsy();
    expect(
      createApiEnv({ ...VALID_ENV, API_DOCS_ENABLED: "true" }).API_DOCS_ENABLED
    ).toBeTruthy();
  });

  it("rejects an R2 endpoint URL in place of the account ID", () => {
    expect(() =>
      createApiEnv({
        ...VALID_ENV,
        R2_ACCOUNT_ID:
          "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com",
      })
    ).toThrow("R2_ACCOUNT_ID");
  });
});
