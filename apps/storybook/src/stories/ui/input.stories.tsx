import { Input } from "@bermula/design-system/components/ui/input";
import { Label } from "@bermula/design-system/components/ui/label";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: { disabled: false, placeholder: "nama@contoh.com", type: "email" },
  component: Input,
  // Primitif tanpa label; untuk form pakai `TextField` (Form/TextField).
  render: (args) => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="story-input">Email</Label>
      <Input {...args} id="story-input" />
    </div>
  ),
  title: "UI/Input",
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "bukan-email" },
};

export const Disabled: Story = {
  args: { disabled: true, value: "budi@contoh.com" },
};
