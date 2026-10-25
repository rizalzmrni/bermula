import { Container } from "@bermula/design-system/components/layout/container";

import { CtaSection } from "../features/landing/cta-section";
import { PricingPlans } from "../features/pricing/pricing-plans";
import { PATHS } from "../lib/paths";
import { pageMeta } from "../lib/site";

export const meta = () =>
  pageMeta({
    description:
      "Pilih paket yang sesuai dengan tim Anda. Mulai gratis, tingkatkan kapan saja.",
    path: PATHS.pricing,
    title: "Harga",
  });

const Pricing = () => (
  <main>
    <section aria-labelledby="pricing-title" className="py-20 md:py-24">
      <Container className="flex flex-col gap-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <h1
            className="text-4xl font-semibold tracking-tight text-balance md:text-5xl"
            id="pricing-title"
          >
            Harga sederhana dan transparan
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Mulai gratis, tingkatkan saat tim Anda bertumbuh.
          </p>
        </div>
        <PricingPlans />
      </Container>
    </section>
    <CtaSection />
  </main>
);

export default Pricing;
