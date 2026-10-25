// Langsung dari `@react-email/render`, bukan re-export `@react-email/components`:
// SDK `resend` meng-`import()` paket ini secara dinamis, sehingga esbuild
// (wrangler) membungkusnya dengan init malas yang tidak dipanggil lewat
// `export *` milik components (`render` jadi `undefined` di Worker).
import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";

import {
  OrganizationInvitation,
  organizationInvitationSubject,
} from "./templates/organization-invitation";
import type { OrganizationInvitationProps } from "./templates/organization-invitation";
import {
  ResetPassword,
  resetPasswordSubject,
} from "./templates/reset-password";
import type { ResetPasswordProps } from "./templates/reset-password";
import { VerifyEmail, verifyEmailSubject } from "./templates/verify-email";
import type { VerifyEmailProps } from "./templates/verify-email";
import type { EmailTransport } from "./transport";

export interface EmailSenderOptions {
  /** Alamat pengirim terverifikasi di Resend, mis. `Bermula <noreply@example.com>`. */
  from: string;
  transport: EmailTransport;
}

type Recipient<T> = T & { to: string };

/**
 * Fungsi kirim per jenis email. Bentuknya cocok dengan `AuthEmailSenders` di
 * `packages/auth`, sehingga apps/api bisa langsung menyuntikkannya ke
 * `createAuth({ emails })`.
 */
export const createEmailSender = ({ from, transport }: EmailSenderOptions) => {
  const send = async ({
    element,
    subject,
    to,
  }: {
    element: ReactElement;
    subject: string;
    to: string;
  }) => {
    const html = await render(element);
    await transport.send({
      from,
      html,
      subject,
      // Versi teks polos membantu aksesibilitas dan skor anti-spam.
      text: toPlainText(html),
      to,
    });
  };

  return {
    sendOrganizationInvitationEmail: ({
      to,
      ...props
    }: Recipient<OrganizationInvitationProps>) =>
      send({
        element: <OrganizationInvitation {...props} />,
        subject: organizationInvitationSubject(props),
        to,
      }),
    sendResetPasswordEmail: ({ to, ...props }: Recipient<ResetPasswordProps>) =>
      send({
        element: <ResetPassword {...props} />,
        subject: resetPasswordSubject(),
        to,
      }),
    sendVerificationEmail: ({ to, ...props }: Recipient<VerifyEmailProps>) =>
      send({
        element: <VerifyEmail {...props} />,
        subject: verifyEmailSubject(),
        to,
      }),
  };
};

export type EmailSender = ReturnType<typeof createEmailSender>;
