import { Container } from "@bermula/design-system/components/layout/container";
import { buttonVariants } from "@bermula/design-system/components/ui/button";

import { SectionHeading } from "../../components/section-heading";
import { APP_PATHS } from "../../lib/paths";
import { appLink } from "../../lib/site";

/** Ajakan penutup; dipakai di beranda dan halaman harga. */
export const CtaSection = () => (
  <section aria-labelledby="cta-title" className="py-20 md:py-24">
    <Container className="flex flex-col items-center gap-8">
      <SectionHeading
        description="Daftar dalam satu menit. Tanpa kartu kredit."
        id="cta-title"
        title="Siap membangun produk berikutnya?"
      />
      <a
        className={buttonVariants({ size: "lg" })}
        href={appLink(APP_PATHS.signUp)}
      >
        Buat akun gratis
      </a>
    </Container>
  </section>
);
