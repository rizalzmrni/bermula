import { describe, expect, it } from "vitest";

import { createAppClientEnv } from "./app";

describe(createAppClientEnv, () => {
  it("parses VITE_API_URL", () => {
    const env = createAppClientEnv({ VITE_API_URL: "http://localhost:8787" });

    expect(env.VITE_API_URL).toBe("http://localhost:8787");
  });

  it("names the missing variable in the error", () => {
    expect(() => createAppClientEnv({})).toThrow("VITE_API_URL");
  });
});
