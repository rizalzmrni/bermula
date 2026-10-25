import { SelectField } from "@bermula/design-system/components/form/select-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ROLE_OPTIONS } from "./options";

const meta = {
  args: {
    className: "w-72",
    label: "Peran",
    name: "role",
    options: ROLE_OPTIONS,
  },
  component: SelectField,
  title: "Form/SelectField",
} satisfies Meta<typeof SelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "admin" },
};

export const WithError: Story = {
  args: { errors: [{ message: "Pilih peran anggota." }] },
};
