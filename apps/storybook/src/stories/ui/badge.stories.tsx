import { Badge } from "@bermula/design-system/components/ui/badge";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ],
    },
  },
  args: { children: "Aktif" },
  component: Badge,
  title: "UI/Badge",
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Badge {...args}>Aktif</Badge>
      <Badge {...args} variant="secondary">
        Draf
      </Badge>
      <Badge {...args} variant="outline">
        Diarsipkan
      </Badge>
      <Badge {...args} variant="destructive">
        Gagal
      </Badge>
    </div>
  ),
};
