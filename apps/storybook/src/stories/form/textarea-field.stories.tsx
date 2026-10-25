import { TextareaField } from "@bermula/design-system/components/form/textarea-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: {
    className: "w-80",
    description: "Maksimal 500 karakter.",
    label: "Deskripsi organisasi",
    name: "description",
  },
  component: TextareaField,
  title: "Form/TextareaField",
} satisfies Meta<typeof TextareaField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
