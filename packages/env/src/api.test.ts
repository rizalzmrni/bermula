import { describe, expect, it } from "vitest";

import { createApiEnv } from "./api";

const VALID_ENV = {
  APP_URL: "http://localhost:5173",
  CORS_ORIGINS: "http://localhost:5173, http://localhost:5174",
  DATABASE_URL: "postgresql://user:pass@ep-test.neon.tech/app?sslmode=require",
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
});
