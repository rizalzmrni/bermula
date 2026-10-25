import { Container } from "@bermula/design-system/components/layout/container";

import { SectionHeading } from "../../components/section-heading";

const STEPS = [
  {
    description: "Buat akun gratis dan undang anggota tim ke organisasi Anda.",
    title: "Daftar",
  },
  {
    description:
      "Atur organisasi, peran anggota, dan keamanan akun dari satu dasbor.",
    title: "Siapkan",
  },
  {
    description:
      "Fokus pada fitur inti produk; fondasinya sudah berjalan di produksi.",
    title: "Kembangkan",
  },
] as const;

export const HowItWorks = () => (
  <section aria-labelledby="how-title" className="py-20 md:py-24">
    <Container className="flex flex-col gap-12">
      <SectionHeading
        eyebrow="Cara kerja"
        id="how-title"
        title="Tiga langkah untuk mulai"
      />
      <ol className="grid gap-8 md:grid-cols-3">
        {STEPS.map(({ description, title }, index) => (
          <li
            className="flex flex-col items-center gap-3 text-center"
            key={title}
          >
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full font-semibold"
            >
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground max-w-xs text-sm">
              {description}
            </p>
          </li>
        ))}
      </ol>
    </Container>
  </section>
);
