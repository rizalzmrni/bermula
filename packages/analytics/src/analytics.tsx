import type { ReactNode } from "react";

import { AnalyticsProvider, getAnalyticsServices } from "./analytics-provider";
import type { AnalyticsConfig } from "./analytics-provider";
import type { Consent } from "./consent";
import { ConsentBanner } from "./consent-banner";

interface AnalyticsProps {
  /** Dari cookie (root loader). */
  consent: Consent | null;
  config: AnalyticsConfig;
  /** Tautan kebijakan privasi di banner. */
  privacyHref: string;
  children: ReactNode;
}

/**
 * Dipasang sekali di `root.tsx`: provider pelacak + banner persetujuan. Tanpa
 * layanan yang dikonfigurasi, banner tidak tampil (tidak ada yang perlu disetujui).
 */
export const Analytics = ({
  consent,
  config,
  privacyHref,
  children,
}: AnalyticsProps) => {
  const services = getAnalyticsServices(config);

  return (
    <AnalyticsProvider {...config} consent={consent}>
      {children}
      {services.length > 0 ? (
        <ConsentBanner
          consent={consent}
          privacyHref={privacyHref}
          services={services}
        />
      ) : null}
    </AnalyticsProvider>
  );
};
