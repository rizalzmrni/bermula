import { describe, expect, it } from "vitest";

import { createWebClientEnv } from "./web";

const VALID_ENV = {
  VITE_APP_URL: "https://app.example.com",
  VITE_WEB_URL: "https://example.com",
};

describe(createWebClientEnv, () => {
  it("parses the app and site origins", () => {
    const env = createWebClientEnv(VALID_ENV);

    expect(env.VITE_APP_URL).toBe("https://app.example.com");
    expect(env.VITE_WEB_URL).toBe("https://example.com");
  });

  it("rejects a non-http URL", () => {
    expect(() =>
      createWebClientEnv({
        ...VALID_ENV,
        VITE_APP_URL: "ftp://app.example.com",
      })
    ).toThrow("VITE_APP_URL");
  });

  it("rejects a site origin with a path", () => {
    expect(() =>
      createWebClientEnv({ ...VALID_ENV, VITE_WEB_URL: "https://example.com/" })
    ).toThrow("VITE_WEB_URL");
  });

  it("keeps the site out of search indexes unless enabled", () => {
    expect(createWebClientEnv(VALID_ENV).VITE_ALLOW_INDEXING).toBeFalsy();
    expect(
      createWebClientEnv({ ...VALID_ENV, VITE_ALLOW_INDEXING: "true" })
        .VITE_ALLOW_INDEXING
    ).toBeTruthy();
  });
});
