import { DatePickerField } from "@bermula/design-system/components/form/date-picker-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: {
    className: "w-72",
    label: "Tanggal mulai",
    name: "startDate",
  },
  component: DatePickerField,
  title: "Form/DatePickerField",
} satisfies Meta<typeof DatePickerField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Tanggal tetap agar tampilan story deterministik.
export const WithValue: Story = {
  args: { defaultValue: new Date(2026, 9, 25) },
};
