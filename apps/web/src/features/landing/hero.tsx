import { Container } from "@bermula/design-system/components/layout/container";
import { Badge } from "@bermula/design-system/components/ui/badge";
import { buttonVariants } from "@bermula/design-system/components/ui/button";
import { Link } from "react-router";

import { APP_PATHS, PATHS } from "../../lib/paths";
import { appLink } from "../../lib/site";

export const Hero = () => (
  <section aria-labelledby="hero-title" className="py-20 md:py-32">
    <Container className="flex flex-col items-center gap-6 text-center">
      <Badge variant="secondary">Siap produksi di Cloudflare Workers</Badge>
      <h1
        className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl"
        id="hero-title"
      >
        Mulai produk SaaS Anda tanpa membangun fondasi dari nol
      </h1>
      <p className="text-muted-foreground max-w-2xl text-lg text-pretty md:text-xl">
        Autentikasi, organisasi, penyimpanan file, email, dan dokumentasi API
        sudah tersedia. Anda tinggal fokus pada fitur yang membuat produk Anda
        berbeda.
      </p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a
          className={buttonVariants({ size: "lg" })}
          href={appLink(APP_PATHS.signUp)}
        >
          Mulai gratis
        </a>
        <Link
          className={buttonVariants({ size: "lg", variant: "outline" })}
          to={PATHS.pricing}
        >
          Lihat harga
        </Link>
      </div>
    </Container>
  </section>
);
