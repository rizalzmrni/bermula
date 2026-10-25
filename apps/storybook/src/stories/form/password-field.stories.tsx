import { PasswordField } from "@bermula/design-system/components/form/password-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: {
    autoComplete: "new-password",
    className: "w-72",
    description: "Minimal 8 karakter.",
    label: "Kata sandi",
    name: "password",
  },
  component: PasswordField,
  title: "Form/PasswordField",
} satisfies Meta<typeof PasswordField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { errors: [{ message: "Kata sandi minimal 8 karakter." }] },
};
