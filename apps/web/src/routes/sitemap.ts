import { sitemapResponse } from "../lib/seo-files";
import { getSiteConfig } from "../lib/site";

export const loader = () => sitemapResponse(getSiteConfig());
