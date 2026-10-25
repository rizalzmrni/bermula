import { useId } from "react";

import type { Consent } from "./consent";
import {
  ConsentButtons,
  formatServices,
  useConsentChoice,
} from "./consent-form";

interface ConsentBannerProps {
  /** Dari cookie (root loader); banner hanya tampil bila belum memilih. */
  consent: Consent | null;
  /** Layanan yang dimuat setelah setuju, mis. `["Google Analytics", "PostHog"]`. */
  services: readonly string[];
  /** Kebijakan privasi; boleh URL absolut (apps/app menautkan ke apps/web). */
  privacyHref: string;
}

/**
 * Banner persetujuan cookie analitik. Dirender saat SSR bila cookie belum ada,
 * jadi tidak berkedip; tidak menutupi konten (tanpa overlay) dan tidak memblokir
 * pemakaian situs.
 */
export const ConsentBanner = ({
  consent,
  services,
  privacyHref,
}: ConsentBannerProps) => {
  const titleId = useId();
  const choice = useConsentChoice(consent);

  if (choice.consent !== null) {
    return null;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="bg-card text-card-foreground fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-lg border p-4 shadow-lg sm:left-auto sm:max-w-md"
    >
      <h2 className="font-semibold" id={titleId}>
        Cookie analitik
      </h2>
      <p className="text-muted-foreground text-sm">
        Kami ingin memakai cookie analitik ({formatServices(services)}) untuk
        memahami cara layanan ini dipakai. Data baru dikirim bila Anda setuju;
        menolak tidak memengaruhi fitur apa pun.{" "}
        <a
          className="text-foreground underline underline-offset-4"
          href={privacyHref}
        >
          Kebijakan privasi
        </a>
      </p>
      <ConsentButtons
        className="flex flex-wrap justify-end gap-2"
        fetcher={choice.fetcher}
      />
    </section>
  );
};
