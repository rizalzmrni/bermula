import { CheckboxField } from "@bermula/design-system/components/form/checkbox-field";
import { SwitchField } from "@bermula/design-system/components/form/switch-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: {
    description: "Perangkat ini tidak akan meminta kode 2FA selama 30 hari.",
    label: "Percayai perangkat ini",
    name: "trustDevice",
  },
  component: CheckboxField,
  title: "Form/CheckboxField & SwitchField",
} satisfies Meta<typeof CheckboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Checkbox: Story = {};

export const Switch: Story = {
  render: () => (
    <SwitchField
      description="Kirim ringkasan aktivitas tim setiap Senin."
      label="Email mingguan"
      name="weeklyDigest"
    />
  ),
};
