import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import {
  BRAND_NAME,
  EMAIL_COLORS,
  EMAIL_FONT_FAMILY,
  EMAIL_RADIUS,
} from "../brand";

const styles = {
  body: {
    backgroundColor: EMAIL_COLORS.background,
    fontFamily: EMAIL_FONT_FAMILY,
    margin: 0,
    padding: "40px 16px",
  },
  brand: {
    color: EMAIL_COLORS.cardForeground,
    fontSize: "18px",
    fontWeight: 700,
    margin: "0 0 24px",
  },
  button: {
    backgroundColor: EMAIL_COLORS.primary,
    borderRadius: EMAIL_RADIUS,
    boxSizing: "border-box",
    color: EMAIL_COLORS.primaryForeground,
    display: "inline-block",
    fontSize: "16px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  },
  container: {
    backgroundColor: EMAIL_COLORS.card,
    border: `1px solid ${EMAIL_COLORS.border}`,
    borderRadius: EMAIL_RADIUS,
    margin: "0 auto",
    maxWidth: "560px",
    padding: "32px",
  },
  fallback: {
    color: EMAIL_COLORS.mutedForeground,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "24px 0 0",
    wordBreak: "break-all",
  },
  footer: {
    color: EMAIL_COLORS.mutedForeground,
    fontSize: "12px",
    lineHeight: "18px",
    margin: 0,
  },
  heading: {
    color: EMAIL_COLORS.cardForeground,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "30px",
    margin: "0 0 16px",
  },
  hr: {
    border: "none",
    borderTop: `1px solid ${EMAIL_COLORS.border}`,
    margin: "32px 0 16px",
  },
  link: { color: EMAIL_COLORS.cardForeground, textDecoration: "underline" },
} as const;

export const emailTextStyle = {
  color: EMAIL_COLORS.cardForeground,
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
} as const;

interface EmailLayoutProps {
  /** Teks pratinjau di daftar kotak masuk. */
  preview: string;
  heading: string;
  /** Tombol aksi utama; URL juga ditampilkan sebagai teks untuk klien yang memblokir tombol. */
  action: { label: string; url: string };
  /** Alasan pengguna menerima email ini, ditampilkan di footer. */
  footnote: string;
  children: ReactNode;
}

export const EmailLayout = ({
  action,
  children,
  footnote,
  heading,
  preview,
}: EmailLayoutProps) => (
  <Html lang="id">
    <Head />
    <Body style={styles.body}>
      <Preview>{preview}</Preview>
      <Container style={styles.container}>
        <Text style={styles.brand}>{BRAND_NAME}</Text>
        <Heading as="h1" style={styles.heading}>
          {heading}
        </Heading>
        {children}
        <Section>
          <Button href={action.url} style={styles.button}>
            {action.label}
          </Button>
        </Section>
        <Text style={styles.fallback}>
          Jika tombol tidak berfungsi, salin tautan berikut ke browser Anda:{" "}
          <Link href={action.url} style={styles.link}>
            {action.url}
          </Link>
        </Text>
        <Hr style={styles.hr} />
        <Text style={styles.footer}>{footnote}</Text>
      </Container>
    </Body>
  </Html>
);
