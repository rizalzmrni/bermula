import { ComboboxField } from "@bermula/design-system/components/form/combobox-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CITY_OPTIONS } from "./options";

const meta = {
  args: {
    className: "w-72",
    label: "Kota",
    name: "city",
    options: CITY_OPTIONS,
    placeholder: "Cari kota",
  },
  component: ComboboxField,
  title: "Form/ComboboxField",
} satisfies Meta<typeof ComboboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "yogyakarta" },
};
