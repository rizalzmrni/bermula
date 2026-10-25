import { RadioGroupField } from "@bermula/design-system/components/form/radio-group-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ROLE_OPTIONS } from "./options";

const meta = {
  args: {
    defaultValue: "member",
    label: "Peran",
    name: "role",
    options: ROLE_OPTIONS,
  },
  component: RadioGroupField,
  title: "Form/RadioGroupField",
} satisfies Meta<typeof RadioGroupField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
