import { APP_NAME } from "@bermula/core/brand";
import { Text } from "@react-email/components";

import { EmailLayout, emailTextStyle } from "../components/email-layout";

export interface ResetPasswordProps {
  name: string;
  url: string;
}

export const resetPasswordSubject = () =>
  `Atur ulang kata sandi ${APP_NAME} Anda`;

export const ResetPassword = ({ name, url }: ResetPasswordProps) => (
  <EmailLayout
    action={{ label: "Atur ulang kata sandi", url }}
    footnote="Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Kata sandi Anda tidak akan berubah."
    heading="Atur ulang kata sandi"
    preview="Tautan untuk mengatur ulang kata sandi Anda"
  >
    <Text style={emailTextStyle}>Halo {name},</Text>
    <Text style={emailTextStyle}>
      Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Klik
      tombol di bawah untuk membuat kata sandi baru. Setelah berhasil, semua
      sesi login lain akan dikeluarkan.
    </Text>
  </EmailLayout>
);

ResetPassword.PreviewProps = {
  name: "Budi",
  url: "http://localhost:8787/api/auth/reset-password/preview",
} satisfies ResetPasswordProps;

// Server preview React Email (apps/email) membaca default export.
export default ResetPassword;
