import { Button } from "@bermula/design-system/components/ui/button";
import { useFetcher, useLocation } from "react-router";
import { z } from "zod";

import { CONSENT, CONSENT_CHOICE } from "./consent";
import type { Consent } from "./consent";

/** Path route action persetujuan; app memasang `handleConsentAction` di sini. */
export const CONSENT_ACTION_PATH = "/consent";

// Banner & halaman pengaturan berbagi satu fetcher, jadi pilihan di salah satu
// langsung terlihat di yang lain sebelum loader selesai memuat ulang.
const CONSENT_FETCHER_KEY = "analytics-consent";

const consentFromChoice = (choice: FormDataEntryValue | null | undefined) => {
  if (choice === CONSENT.granted || choice === CONSENT.denied) {
    return choice;
  }
  return choice === CONSENT_CHOICE.reset ? null : undefined;
};

const actionResultSchema = z.object({
  consent: z.enum([CONSENT.granted, CONSENT.denied]).nullable(),
});

/**
 * Pilihan yang berlaku: yang sedang dikirim, lalu hasil action terakhir, lalu
 * cookie (via loader). UI langsung berubah tanpa menunggu loader dimuat ulang.
 */
export const useConsentChoice = (consent: Consent | null) => {
  const fetcher = useFetcher({ key: CONSENT_FETCHER_KEY });
  const pending = consentFromChoice(fetcher.formData?.get("consent"));
  if (pending !== undefined) {
    return { consent: pending, fetcher };
  }
  const result = actionResultSchema.safeParse(fetcher.data);
  return { consent: result.success ? result.data.consent : consent, fetcher };
};

const listFormatter = new Intl.ListFormat("id-ID", { type: "conjunction" });

/** "Google Analytics dan PostHog". */
export const formatServices = (services: readonly string[]) =>
  listFormatter.format(services);

interface ConsentButtonsProps {
  fetcher: ReturnType<typeof useConsentChoice>["fetcher"];
  /** Pilihan aktif (halaman pengaturan); di banner selalu `null`. */
  current?: Consent | null;
  className?: string;
}

/**
 * Dua tombol submit (`consent=granted|denied`) dengan bobot visual yang sama:
 * menolak harus semudah menerima (pedoman persetujuan GDPR/UU PDP). Hanya
 * pilihan aktif yang ditandai tombol utama. Tanpa JavaScript, form tetap
 * terkirim dan action me-redirect kembali ke `redirectTo`.
 */
export const ConsentButtons = ({
  fetcher,
  current = null,
  className,
}: ConsentButtonsProps) => {
  const location = useLocation();

  return (
    <fetcher.Form
      action={CONSENT_ACTION_PATH}
      className={className ?? "flex flex-wrap gap-2"}
      method="post"
    >
      <input
        name="redirectTo"
        type="hidden"
        value={`${location.pathname}${location.search}`}
      />
      <Button
        name="consent"
        type="submit"
        value={CONSENT.denied}
        variant={current === CONSENT.denied ? "default" : "outline"}
      >
        Tolak
      </Button>
      <Button
        name="consent"
        type="submit"
        value={CONSENT.granted}
        variant={current === CONSENT.granted ? "default" : "outline"}
      >
        Terima
      </Button>
    </fetcher.Form>
  );
};
