import { toPostHogConfig } from "@bermula/analytics/analytics-provider";
import type { AnalyticsConfig } from "@bermula/analytics/analytics-provider";
import { getAppClientEnv } from "@bermula/env/app";

// Path halaman di apps/web (bukan domain: origin-nya dari `VITE_WEB_URL`).
const WEB_PRIVACY_PATH = "/privasi";

/** Analitik produk lewat PostHog saja; Google Analytics hanya di apps/web. */
export const getAnalyticsConfig = (): AnalyticsConfig => {
  const env = getAppClientEnv();
  return {
    posthog: toPostHogConfig({
      host: env.VITE_POSTHOG_HOST,
      projectToken: env.VITE_POSTHOG_PROJECT_TOKEN,
    }),
  };
};

export const getPrivacyPolicyUrl = () =>
  `${getAppClientEnv().VITE_WEB_URL}${WEB_PRIVACY_PATH}`;
