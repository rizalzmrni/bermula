import {
  faqPageJsonLd,
  jsonLdMeta,
  organizationJsonLd,
  websiteJsonLd,
} from "@bermula/seo/json-ld";

import { CtaSection } from "../features/landing/cta-section";
import { FAQ_ITEMS } from "../features/landing/faq-items";
import { FaqSection } from "../features/landing/faq-section";
import { FeaturesSection } from "../features/landing/features-section";
import { Hero } from "../features/landing/hero";
import { HowItWorks } from "../features/landing/how-it-works";
import { PATHS } from "../lib/paths";
import { getSiteConfig, pageMeta } from "../lib/site";

export const meta = () => {
  const { siteUrl } = getSiteConfig();
  return [
    ...pageMeta({
      description:
        "Fondasi SaaS siap produksi di Cloudflare Workers: autentikasi, organisasi, penyimpanan file, email, dan API terdokumentasi.",
      path: PATHS.home,
    }),
    jsonLdMeta(organizationJsonLd({ siteUrl })),
    jsonLdMeta(websiteJsonLd({ siteUrl })),
    jsonLdMeta(faqPageJsonLd(FAQ_ITEMS)),
  ];
};

const Home = () => (
  <main>
    <Hero />
    <FeaturesSection />
    <HowItWorks />
    <FaqSection />
    <CtaSection />
  </main>
);

export default Home;
