import { APP_NAME } from "@bermula/core/brand";

import { absoluteUrl } from "./url";

// Data terstruktur schema.org. Disisipkan lewat meta React Router
// `{ "script:ld+json": data }`, yang sudah meng-escape `</script>`.

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLd = Record<string, JsonLdValue>;

const CONTEXT = "https://schema.org";

export const organizationJsonLd = ({
  logo,
  sameAs = [],
  siteUrl,
}: {
  siteUrl: string;
  /** URL absolut logo. */
  logo?: string;
  /** Profil media sosial resmi. */
  sameAs?: string[];
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": "Organization",
  name: APP_NAME,
  url: absoluteUrl(siteUrl),
  ...(logo ? { logo } : {}),
  ...(sameAs.length > 0 ? { sameAs } : {}),
});

export const websiteJsonLd = ({ siteUrl }: { siteUrl: string }): JsonLd => ({
  "@context": CONTEXT,
  "@type": "WebSite",
  inLanguage: "id-ID",
  name: APP_NAME,
  url: absoluteUrl(siteUrl),
});

export interface FaqItem {
  question: string;
  answer: string;
}

/** Halaman FAQ; pertanyaan & jawaban wajib sama dengan yang tampil di halaman. */
export const faqPageJsonLd = (items: readonly FaqItem[]): JsonLd => ({
  "@context": CONTEXT,
  "@type": "FAQPage",
  mainEntity: items.map(({ answer, question }) => ({
    "@type": "Question",
    acceptedAnswer: { "@type": "Answer", text: answer },
    name: question,
  })),
});

/** Bentuk meta React Router untuk menyisipkan satu atau beberapa JSON-LD. */
export const jsonLdMeta = (data: JsonLd | JsonLd[]) => ({
  "script:ld+json": data,
});
