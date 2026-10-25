import { describe, expect, it } from "vitest";

import { buildPageMeta, pageTitle } from "./meta";

const SITE = "https://example.com";

describe(buildPageMeta, () => {
  it("builds title, canonical, Open Graph, and Twitter tags", () => {
    const tags = buildPageMeta({
      description: "Paket & harga.",
      path: "/harga",
      siteUrl: SITE,
      title: "Harga",
    });

    expect(tags).toStrictEqual(
      expect.arrayContaining([
        { title: "Harga — Bermula" },
        { content: "Paket & harga.", name: "description" },
        { href: `${SITE}/harga`, rel: "canonical", tagName: "link" },
        { content: `${SITE}/harga`, property: "og:url" },
        { content: "id_ID", property: "og:locale" },
        { content: "summary", name: "twitter:card" },
      ])
    );
    expect(tags).not.toContainEqual(
      expect.objectContaining({ name: "robots" })
    );
  });

  it("adds image and noindex tags only when asked", () => {
    const tags = buildPageMeta({
      description: "x",
      image: `${SITE}/og.png`,
      noIndex: true,
      path: "/",
      siteUrl: SITE,
    });

    expect(tags).toStrictEqual(
      expect.arrayContaining([
        { title: "Bermula" },
        { content: `${SITE}/og.png`, property: "og:image" },
        { content: "summary_large_image", name: "twitter:card" },
        { content: "noindex, nofollow", name: "robots" },
      ])
    );
  });
});

describe(pageTitle, () => {
  it("uses the brand alone on the home page", () => {
    expect(pageTitle()).toBe("Bermula");
  });
});
