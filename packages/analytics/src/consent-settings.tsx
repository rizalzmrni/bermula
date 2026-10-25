import { Badge } from "@bermula/design-system/components/ui/badge";

import { CONSENT } from "./consent";
import type { Consent } from "./consent";
import {
  ConsentButtons,
  formatServices,
  useConsentChoice,
} from "./consent-form";

const STATUS_LABEL = {
  [CONSENT.denied]: "Ditolak",
  [CONSENT.granted]: "Disetujui",
} as const satisfies Record<Consent, string>;

interface ConsentSettingsProps {
  consent: Consent | null;
  services: readonly string[];
}

/** Ubah atau cabut persetujuan kapan saja (halaman pengaturan cookie). */
export const ConsentSettings = ({
  consent,
  services,
}: ConsentSettingsProps) => {
  const choice = useConsentChoice(consent);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Cookie analitik ({formatServices(services)}):</span>
        <Badge
          variant={choice.consent === CONSENT.granted ? "default" : "outline"}
        >
          {choice.consent ? STATUS_LABEL[choice.consent] : "Belum memilih"}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        Cookie yang wajib untuk login dan keamanan selalu aktif dan tidak
        dipakai untuk analitik. Mencabut persetujuan langsung menghentikan
        pengiriman data analitik dari perangkat ini.
      </p>
      <ConsentButtons current={choice.consent} fetcher={choice.fetcher} />
    </div>
  );
};
