import { describe, expect, it } from "vitest";

import { buildRobots } from "./robots";

const SITE = "https://example.com";

describe(buildRobots, () => {
  it("allows crawling and points to the sitemap", () => {
    expect(
      buildRobots({ allowIndexing: true, disallow: ["/api"], siteUrl: SITE })
    ).toBe(
      "User-agent: *\nAllow: /\nDisallow: /api\n\nSitemap: https://example.com/sitemap.xml\n"
    );
  });

  it("blocks the whole site when indexing is off", () => {
    expect(buildRobots({ allowIndexing: false, siteUrl: SITE })).toContain(
      "User-agent: *\nDisallow: /\n"
    );
  });
});
