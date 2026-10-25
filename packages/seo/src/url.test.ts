import { describe, expect, it } from "vitest";

import { absoluteUrl } from "./url";

const SITE = "https://example.com";

describe(absoluteUrl, () => {
  it("returns the origin for the home page", () => {
    expect(absoluteUrl(SITE)).toBe(SITE);
    expect(absoluteUrl(SITE, "/")).toBe(SITE);
  });

  it("joins paths and drops trailing slashes", () => {
    expect(absoluteUrl(SITE, "/harga")).toBe(`${SITE}/harga`);
    expect(absoluteUrl(SITE, "harga/")).toBe(`${SITE}/harga`);
  });
});
