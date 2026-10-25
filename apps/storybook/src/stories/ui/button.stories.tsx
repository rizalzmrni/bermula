import { Button } from "@bermula/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconPlus } from "@tabler/icons-react";

const meta = {
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg"],
    },
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
  },
  args: { children: "Simpan", disabled: false, size: "default" },
  component: Button,
  title: "UI/Button",
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args}>Utama</Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Sekunder
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Hapus
      </Button>
      <Button {...args} variant="link">
        Tautan
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <IconPlus aria-hidden="true" />
        Tambah anggota
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    "aria-label": "Tambah",
    children: <IconPlus aria-hidden="true" />,
    size: "icon",
    variant: "outline",
  },
};
