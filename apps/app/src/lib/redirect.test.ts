import { describe, expect, it } from "vitest";

import { getLoginUrl, getSafeRedirect } from "./redirect";

describe(getSafeRedirect, () => {
  it("keeps internal paths with their query", () => {
    expect(getSafeRedirect("/proyek?tab=aktif")).toBe("/proyek?tab=aktif");
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "proyek",
  ])("falls back to home for %j", (target) => {
    expect(getSafeRedirect(target)).toBe("/");
  });
});

describe(getLoginUrl, () => {
  it("carries the current path and query as redirectTo", () => {
    const request = new Request("http://localhost/proyek/1?tab=file");
    expect(getLoginUrl(request)).toBe(
      "/masuk?redirectTo=%2Fproyek%2F1%3Ftab%3Dfile"
    );
  });

  it("omits redirectTo for the home page", () => {
    expect(getLoginUrl(new Request("http://localhost/"))).toBe("/masuk");
  });
});
