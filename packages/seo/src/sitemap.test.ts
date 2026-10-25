import { describe, expect, it } from "vitest";

import { CHANGE_FREQUENCY, buildSitemap } from "./sitemap";

describe(buildSitemap, () => {
  it("lists absolute, escaped URLs with optional fields", () => {
    const xml = buildSitemap({
      entries: [
        {
          changeFrequency: CHANGE_FREQUENCY.weekly,
          lastModified: new Date("2026-10-25T12:00:00.000Z"),
          path: "/",
          priority: 1,
        },
        { path: "/cari?q=a&b" },
      ],
      siteUrl: "https://example.com",
    });

    expect(xml).toContain(
      "<url><loc>https://example.com</loc><lastmod>2026-10-25</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>"
    );
    expect(xml).toContain(
      "<url><loc>https://example.com/cari?q=a&amp;b</loc></url>"
    );
    expect(
      xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')
    ).toBeTruthy();
  });
});
