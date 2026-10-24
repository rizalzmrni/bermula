import { Text } from "@react-email/components";

import { BRAND_NAME } from "../brand";
import { EmailLayout, emailTextStyle } from "../components/email-layout";

export interface OrganizationInvitationProps {
  inviterName: string;
  organizationName: string;
  url: string;
}

export const organizationInvitationSubject = ({
  inviterName,
  organizationName,
}: Pick<OrganizationInvitationProps, "inviterName" | "organizationName">) =>
  `${inviterName} mengundang Anda ke ${organizationName} di ${BRAND_NAME}`;

export const OrganizationInvitation = ({
  inviterName,
  organizationName,
  url,
}: OrganizationInvitationProps) => (
  <EmailLayout
    action={{ label: "Lihat undangan", url }}
    footnote="Undangan ini berlaku 48 jam. Jika Anda tidak mengenal pengirimnya, abaikan email ini."
    heading={`Bergabung dengan ${organizationName}`}
    preview={`${inviterName} mengundang Anda ke ${organizationName}`}
  >
    <Text style={emailTextStyle}>
      {inviterName} mengundang Anda untuk bergabung dengan organisasi{" "}
      <strong>{organizationName}</strong> di {BRAND_NAME}.
    </Text>
    <Text style={emailTextStyle}>
      Masuk atau daftar dengan alamat email ini untuk menerima undangan.
    </Text>
  </EmailLayout>
);

OrganizationInvitation.PreviewProps = {
  inviterName: "Budi",
  organizationName: "Tim Pemasaran",
  url: "http://localhost:5173/accept-invitation/preview",
} satisfies OrganizationInvitationProps;

// Server preview React Email (apps/email) membaca default export.
export default OrganizationInvitation;
