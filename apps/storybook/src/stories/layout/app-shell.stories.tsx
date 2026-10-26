import { AppShell } from "@bermula/design-system/components/layout/app-shell";
import { Button } from "@bermula/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { APP_GROUPS } from "./navigation-data";

const meta = {
  args: {
    actions: <Button size="sm">Unggah</Button>,
    children: (
      <div className="text-muted-foreground p-4 text-sm md:p-6">
        Konten halaman.
      </div>
    ),
    defaultOpen: true,
    groups: APP_GROUPS,
    title: "Dasbor",
  },
  component: AppShell,
  parameters: { layout: "fullscreen" },
  title: "Layout/AppShell",
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Sidebar terlipat ke ikon (di app dari cookie `sidebar_state`).
export const Collapsed: Story = {
  args: { defaultOpen: false },
};
