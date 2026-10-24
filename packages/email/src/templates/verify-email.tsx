import { Text } from "@react-email/components";

import { BRAND_NAME } from "../brand";
import { EmailLayout, emailTextStyle } from "../components/email-layout";

export interface VerifyEmailProps {
  name: string;
  url: string;
}

export const verifyEmailSubject = () =>
  `Verifikasi email Anda di ${BRAND_NAME}`;

export const VerifyEmail = ({ name, url }: VerifyEmailProps) => (
  <EmailLayout
    action={{ label: "Verifikasi email", url }}
    footnote={`Anda menerima email ini karena alamat ini didaftarkan di ${BRAND_NAME}. Jika bukan Anda, abaikan email ini.`}
    heading="Verifikasi alamat email Anda"
    preview={`Satu langkah lagi untuk mulai memakai ${BRAND_NAME}`}
  >
    <Text style={emailTextStyle}>Halo {name},</Text>
    <Text style={emailTextStyle}>
      Terima kasih telah mendaftar. Klik tombol di bawah untuk memastikan alamat
      email ini milik Anda.
    </Text>
  </EmailLayout>
);

VerifyEmail.PreviewProps = {
  name: "Budi",
  url: "http://localhost:8787/api/auth/verify-email?token=preview",
} satisfies VerifyEmailProps;

// Server preview React Email (apps/email) membaca default export.
export default VerifyEmail;
