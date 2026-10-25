import { EmptyState } from "@bermula/design-system/components/feedback/empty-state";
import { Button } from "@bermula/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconFiles } from "@tabler/icons-react";

const meta = {
  args: {
    action: <Button>Unggah dokumen</Button>,
    description: "Dokumen yang diunggah anggota tim akan tampil di sini.",
    icon: IconFiles,
    title: "Belum ada dokumen",
  },
  component: EmptyState,
  title: "Feedback/EmptyState",
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutAction: Story = {
  args: { action: undefined },
};
