import { buildRobots } from "@bermula/seo/robots";
import { buildSitemap, CHANGE_FREQUENCY } from "@bermula/seo/sitemap";
import type { SitemapEntry } from "@bermula/seo/sitemap";

import { PATHS } from "./paths";
import type { SiteConfig } from "./site";

// Satu jam: cukup segar untuk crawler, tanpa merender ulang di setiap request.
const CACHE_CONTROL = "public, max-age=3600";

const SITEMAP_ENTRIES: SitemapEntry[] = [
  { changeFrequency: CHANGE_FREQUENCY.weekly, path: PATHS.home, priority: 1 },
  {
    changeFrequency: CHANGE_FREQUENCY.monthly,
    path: PATHS.pricing,
    priority: 0.8,
  },
  {
    changeFrequency: CHANGE_FREQUENCY.yearly,
    path: PATHS.privacy,
    priority: 0.3,
  },
  {
    changeFrequency: CHANGE_FREQUENCY.yearly,
    path: PATHS.terms,
    priority: 0.3,
  },
];

type SiteFileConfig = Pick<SiteConfig, "allowIndexing" | "siteUrl">;

export const sitemapResponse = ({ siteUrl }: SiteFileConfig) =>
  new Response(buildSitemap({ entries: SITEMAP_ENTRIES, siteUrl }), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "application/xml; charset=utf-8",
    },
  });

export const robotsResponse = ({ allowIndexing, siteUrl }: SiteFileConfig) =>
  new Response(buildRobots({ allowIndexing, siteUrl }), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
