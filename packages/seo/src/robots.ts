import { absoluteUrl } from "./url";

export const SITEMAP_PATH = "/sitemap.xml";

/**
 * Isi `robots.txt`. `allowIndexing: false` menutup seluruh situs, untuk
 * lingkungan selain produksi (staging/preview) agar tidak ikut terindeks.
 */
export const buildRobots = ({
  allowIndexing,
  disallow = [],
  siteUrl,
}: {
  allowIndexing: boolean;
  /** Path yang tidak boleh dirayapi saat indeks diizinkan. */
  disallow?: readonly string[];
  siteUrl: string;
}) => {
  const rules = allowIndexing
    ? ["Allow: /", ...disallow.map((path) => `Disallow: ${path}`)]
    : ["Disallow: /"];

  return [
    "User-agent: *",
    ...rules,
    "",
    `Sitemap: ${absoluteUrl(siteUrl, SITEMAP_PATH)}`,
    "",
  ].join("\n");
};
