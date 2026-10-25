import { describe, expect, it } from "vitest";

import {
  faqPageJsonLd,
  jsonLdMeta,
  organizationJsonLd,
  websiteJsonLd,
} from "./json-ld";

const SITE = "https://example.com";

describe("json-ld builders", () => {
  it("describes the organization and website", () => {
    expect(organizationJsonLd({ siteUrl: SITE })).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Bermula",
      url: SITE,
    });
    expect(websiteJsonLd({ siteUrl: SITE })).toMatchObject({
      "@type": "WebSite",
      inLanguage: "id-ID",
    });
  });

  it("maps FAQ items to schema.org questions", () => {
    const faq = faqPageJsonLd([{ answer: "Ya.", question: "Gratis?" }]);

    expect(faq.mainEntity).toStrictEqual([
      {
        "@type": "Question",
        acceptedAnswer: { "@type": "Answer", text: "Ya." },
        name: "Gratis?",
      },
    ]);
    expect(jsonLdMeta(faq)).toStrictEqual({ "script:ld+json": faq });
  });
});
