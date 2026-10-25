import { formatDate } from "@bermula/core/format";
import { Container } from "@bermula/design-system/components/layout/container";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@bermula/design-system/components/ui/alert";
import { IconAlertTriangle } from "@tabler/icons-react";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  /** Tanggal berlaku; ditulis tetap di konten agar SSR dan hidrasi sama. */
  lastUpdated: Date;
  sections: LegalSection[];
}

/** Tata letak halaman legal: judul, tanggal berlaku, lalu bagian bernomor. */
export const LegalPage = ({ document }: { document: LegalDocument }) => (
  <main className="py-16 md:py-24">
    <Container className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {document.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          Berlaku sejak{" "}
          <time dateTime={document.lastUpdated.toISOString()}>
            {formatDate(document.lastUpdated, { dateStyle: "long" })}
          </time>
        </p>
      </header>
      {/* Pengingat untuk pemakai template: teks di bawah hanya contoh. */}
      <Alert>
        <IconAlertTriangle aria-hidden="true" />
        <AlertTitle>Contoh teks</AlertTitle>
        <AlertDescription>
          Dokumen ini adalah placeholder. Ganti dengan teks yang telah ditinjau
          penasihat hukum sebelum situs dipublikasikan.
        </AlertDescription>
      </Alert>
      <ol className="flex flex-col gap-8">
        {document.sections.map((section, index) => (
          <li className="flex flex-col gap-3" key={section.heading}>
            <h2 className="text-xl font-semibold">
              {index + 1}. {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                className="text-muted-foreground leading-relaxed"
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
          </li>
        ))}
      </ol>
    </Container>
  </main>
);
