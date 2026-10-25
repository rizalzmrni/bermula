import { describe, expect, it } from "vitest";

import { getLoginUrl, getSafeRedirect } from "./redirect";

describe(getSafeRedirect, () => {
  it("keeps internal paths with their query", () => {
    expect(getSafeRedirect("/projects?tab=active")).toBe(
      "/projects?tab=active"
    );
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "projects",
  ])("falls back to home for %j", (target) => {
    expect(getSafeRedirect(target)).toBe("/");
  });
});

describe(getLoginUrl, () => {
  it("carries the current path and query as redirectTo", () => {
    const request = new Request("http://localhost/projects/1?tab=files");
    expect(getLoginUrl(request)).toBe(
      "/sign-in?redirectTo=%2Fprojects%2F1%3Ftab%3Dfiles"
    );
  });

  it("omits redirectTo for the home page", () => {
    expect(getLoginUrl(new Request("http://localhost/"))).toBe("/sign-in");
  });
});
