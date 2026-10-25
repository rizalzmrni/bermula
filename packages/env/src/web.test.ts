import { describe, expect, it } from "vitest";

import { createWebClientEnv } from "./web";

describe(createWebClientEnv, () => {
  it("parses VITE_APP_URL", () => {
    const env = createWebClientEnv({ VITE_APP_URL: "https://app.example.com" });

    expect(env.VITE_APP_URL).toBe("https://app.example.com");
  });

  it("rejects a non-http URL", () => {
    expect(() =>
      createWebClientEnv({ VITE_APP_URL: "ftp://app.example.com" })
    ).toThrow("VITE_APP_URL");
  });
});
