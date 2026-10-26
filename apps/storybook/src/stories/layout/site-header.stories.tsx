import { SiteHeader } from "@bermula/design-system/components/layout/site-header";
import { Button } from "@bermula/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SITE_ITEMS } from "./navigation-data";

const meta = {
  args: {
    actions: (
      <>
        <Button variant="ghost">Masuk</Button>
        <Button>Daftar</Button>
      </>
    ),
    items: SITE_ITEMS,
  },
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  title: "Layout/SiteHeader",
} satisfies Meta<typeof SiteHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Di bawah `md` nav berpindah ke sheet; pilih viewport mobile di toolbar.
export const WithoutThemeToggle: Story = {
  args: { showThemeToggle: false },
};
