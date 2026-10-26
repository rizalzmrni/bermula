import { toPostHogConfig } from "@bermula/analytics/analytics-provider";
import type { AnalyticsConfig } from "@bermula/analytics/analytics-provider";
import { getWebClientEnv } from "@bermula/env/web";

/** GA dan PostHog dari env `VITE_*`; layanan yang env-nya kosong tidak aktif. */
export const getAnalyticsConfig = (): AnalyticsConfig => {
  const env = getWebClientEnv();
  return {
    googleAnalyticsId: env.VITE_GA_MEASUREMENT_ID,
    posthog: toPostHogConfig({
      host: env.VITE_POSTHOG_HOST,
      projectToken: env.VITE_POSTHOG_PROJECT_TOKEN,
    }),
  };
};
