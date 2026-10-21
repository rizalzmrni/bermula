import { describe, expect, it } from "vitest";

import { createApiEnv } from "./api";

const VALID_ENV = {
  APP_URL: "http://localhost:5173",
  CORS_ORIGINS: "http://localhost:5173, http://localhost:5174",
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
});
