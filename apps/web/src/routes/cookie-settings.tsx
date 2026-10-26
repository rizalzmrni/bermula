import { getAnalyticsServices } from "@bermula/analytics/analytics-provider";
import { ConsentSettings } from "@bermula/analytics/consent-settings";
import { Container } from "@bermula/design-system/components/layout/container";

import { getAnalyticsConfig } from "../lib/analytics";
import { PATHS } from "../lib/paths";
import { pageMeta } from "../lib/site";
import { useConsent } from "../root";

// Halaman utilitas per pengunjung; tidak perlu muncul di hasil pencarian.
export const meta = () =>
  pageMeta({
    description: "Ubah atau cabut persetujuan cookie analitik.",
    noIndex: true,
    path: PATHS.cookieSettings,
    title: "Pengaturan Cookie",
  });

const CookieSettings = () => {
  const consent = useConsent();
  const services = getAnalyticsServices(getAnalyticsConfig());

  return (
    <main className="py-16 md:py-24">
      <Container className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Pengaturan Cookie
        </h1>
        {services.length > 0 ? (
          <ConsentSettings consent={consent} services={services} />
        ) : (
          <p className="text-muted-foreground">
            Situs ini tidak memakai cookie analitik. Hanya cookie yang wajib
            untuk menjalankan situs yang dipakai.
          </p>
        )}
      </Container>
    </main>
  );
};

export default CookieSettings;
