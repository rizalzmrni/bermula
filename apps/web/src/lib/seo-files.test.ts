import { describe, expect, it } from "vitest";

import { robotsResponse, sitemapResponse } from "./seo-files";

const SITE_URL = "https://example.com";

describe(sitemapResponse, () => {
  it("lists every public page as absolute XML urls", async () => {
    const response = sitemapResponse({
      allowIndexing: true,
      siteUrl: SITE_URL,
    });
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(body).toContain(`<loc>${SITE_URL}</loc>`);
    for (const path of ["/harga", "/privasi", "/syarat"]) {
      expect(body).toContain(`<loc>${SITE_URL}${path}</loc>`);
    }
  });
});

describe(robotsResponse, () => {
  it("blocks crawling unless indexing is allowed", async () => {
    const blocked = robotsResponse({ allowIndexing: false, siteUrl: SITE_URL });
    const allowed = robotsResponse({ allowIndexing: true, siteUrl: SITE_URL });

    await expect(blocked.text()).resolves.toContain("Disallow: /");
    await expect(allowed.text()).resolves.toContain("Allow: /");
    expect(blocked.headers.get("Content-Type")).toContain("text/plain");
  });

  it("points crawlers at the sitemap", async () => {
    const response = robotsResponse({ allowIndexing: true, siteUrl: SITE_URL });

    await expect(response.text()).resolves.toContain(
      `Sitemap: ${SITE_URL}/sitemap.xml`
    );
  });
});
