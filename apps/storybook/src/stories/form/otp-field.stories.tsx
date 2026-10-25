import { OtpField } from "@bermula/design-system/components/form/otp-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: {
    description: "Masukkan 6 digit dari aplikasi authenticator Anda.",
    label: "Kode verifikasi",
    name: "code",
  },
  component: OtpField,
  title: "Form/OtpField",
} satisfies Meta<typeof OtpField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { errors: [{ message: "Kode salah atau sudah kedaluwarsa." }] },
};
