import { TextField } from "@bermula/design-system/components/form/text-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: {
    className: "w-72",
    label: "Nama lengkap",
    name: "name",
    placeholder: "Budi Santoso",
  },
  component: TextField,
  title: "Form/TextField",
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: "Tampil di undangan dan email ke anggota tim.",
  },
};

// `errors` berbentuk sama dengan `field.state.meta.errors` TanStack Form.
export const WithError: Story = {
  args: {
    defaultValue: "B",
    errors: [{ message: "Nama minimal 2 karakter." }],
  },
};

export const Disabled: Story = {
  args: { defaultValue: "Budi Santoso", disabled: true },
};
