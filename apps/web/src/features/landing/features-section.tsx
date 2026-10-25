import { Container } from "@bermula/design-system/components/layout/container";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import type { NavIcon } from "@bermula/design-system/lib/navigation";
import {
  IconApi,
  IconBuildingCommunity,
  IconCloudUpload,
  IconMail,
  IconShieldLock,
  IconTopologyStar3,
} from "@tabler/icons-react";

import { SectionHeading } from "../../components/section-heading";

interface Feature {
  title: string;
  description: string;
  icon: NavIcon;
}

const FEATURES: Feature[] = [
  {
    description:
      "Email & kata sandi, verifikasi email, reset kata sandi, dan autentikasi dua faktor.",
    icon: IconShieldLock,
    title: "Autentikasi lengkap",
  },
  {
    description:
      "Data setiap tim terpisah per organisasi, lengkap dengan undangan dan peran anggota.",
    icon: IconBuildingCommunity,
    title: "Organisasi & peran",
  },
  {
    description:
      "Unggah file langsung ke Cloudflare R2 lewat URL bertanda tangan, tanpa membebani server.",
    icon: IconCloudUpload,
    title: "Penyimpanan file",
  },
  {
    description:
      "Template email transaksional yang bisa dipratinjau dan dikirim lewat Resend.",
    icon: IconMail,
    title: "Email transaksional",
  },
  {
    description:
      "Kontrak API bertipe dari skema hingga klien, terdokumentasi otomatis di OpenAPI.",
    icon: IconApi,
    title: "API terdokumentasi",
  },
  {
    description:
      "Berjalan di jaringan global Cloudflare dengan log terstruktur dan pelacakan error.",
    icon: IconTopologyStar3,
    title: "Cepat & teramati",
  },
];

export const FeaturesSection = () => (
  <section
    aria-labelledby="features-title"
    className="bg-muted/40 py-20 md:py-24"
    id="fitur"
  >
    <Container className="flex flex-col gap-12">
      <SectionHeading
        description="Semua bagian yang biasanya memakan waktu berminggu-minggu sudah tersusun rapi dan teruji."
        eyebrow="Fitur"
        id="features-title"
        title="Fondasi yang Anda butuhkan sejak hari pertama"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ description, icon: Icon, title }) => (
          <li key={title}>
            <Card className="h-full">
              <CardHeader>
                <span
                  aria-hidden="true"
                  className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg"
                >
                  <Icon className="size-5" />
                </span>
                <CardTitle>
                  <h3>{title}</h3>
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);
