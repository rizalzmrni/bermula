import { describe, expect, it } from "vitest";

import { createAppClientEnv } from "./app";

const VALID_ENV = {
  VITE_API_URL: "http://localhost:8787",
  VITE_WEB_URL: "http://localhost:5174",
};

describe(createAppClientEnv, () => {
  it("parses VITE_API_URL", () => {
    const env = createAppClientEnv(VALID_ENV);

    expect(env.VITE_API_URL).toBe("http://localhost:8787");
    expect(env.VITE_WEB_URL).toBe("http://localhost:5174");
  });

  it("names the missing variable in the error", () => {
    expect(() => createAppClientEnv({})).toThrow("VITE_API_URL");
  });

  it("requires the PostHog token and host together", () => {
    const base = VALID_ENV;

    expect(
      createAppClientEnv({
        ...base,
        VITE_POSTHOG_HOST: "https://eu.i.posthog.com",
        VITE_POSTHOG_PROJECT_TOKEN: "phc_test",
      }).VITE_POSTHOG_PROJECT_TOKEN
    ).toBe("phc_test");
    expect(() =>
      createAppClientEnv({ ...base, VITE_POSTHOG_PROJECT_TOKEN: "phc_test" })
    ).toThrow("VITE_POSTHOG_HOST");
  });

  it("rejects a PostHog personal API key in place of the project token", () => {
    expect(() =>
      createAppClientEnv({
        ...VALID_ENV,
        VITE_POSTHOG_HOST: "https://eu.i.posthog.com",
        VITE_POSTHOG_PROJECT_TOKEN: "phx_secret",
      })
    ).toThrow("VITE_POSTHOG_PROJECT_TOKEN");
  });
});
