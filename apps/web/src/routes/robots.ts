import { robotsResponse } from "../lib/seo-files";
import { getSiteConfig } from "../lib/site";

export const loader = () => robotsResponse(getSiteConfig());
