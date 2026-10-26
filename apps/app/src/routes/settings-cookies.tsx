import { getAnalyticsServices } from "@bermula/analytics/analytics-provider";
import { ConsentSettings } from "@bermula/analytics/consent-settings";
import { APP_NAME } from "@bermula/core/brand";

import { getAnalyticsConfig, getPrivacyPolicyUrl } from "../lib/analytics";
import { useConsent } from "../root";

export const meta = () => [{ title: `Cookie — ${APP_NAME}` }];

const CookieSettingsPage = () => {
  const consent = useConsent();
  const services = getAnalyticsServices(getAnalyticsConfig());

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cookie</h1>
        <p className="text-muted-foreground text-sm">
          Atur cookie analitik di perangkat ini. Rinciannya ada di{" "}
          <a
            className="text-foreground underline underline-offset-4"
            href={getPrivacyPolicyUrl()}
          >
            kebijakan privasi
          </a>
          .
        </p>
      </div>
      {services.length > 0 ? (
        <ConsentSettings consent={consent} services={services} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Aplikasi ini tidak memakai cookie analitik. Hanya cookie yang wajib
          untuk login dan keamanan yang dipakai.
        </p>
      )}
    </div>
  );
};

export default CookieSettingsPage;
