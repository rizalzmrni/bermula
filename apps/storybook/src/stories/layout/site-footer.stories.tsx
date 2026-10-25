import { SiteFooter } from "@bermula/design-system/components/layout/site-footer";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconBrandGithub, IconBrandX } from "@tabler/icons-react";

import { FOOTER_GROUPS } from "./navigation-data";

const meta = {
  args: {
    description: "Fondasi SaaS siap produksi di Cloudflare Workers.",
    groups: FOOTER_GROUPS,
    socialLinks: [
      {
        external: true,
        href: "https://github.com",
        icon: IconBrandGithub,
        title: "GitHub",
      },
      { external: true, href: "https://x.com", icon: IconBrandX, title: "X" },
    ],
    // Di app, tahun datang dari loader; di story ditulis tetap.
    year: 2026,
  },
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
  title: "Layout/SiteFooter",
} satisfies Meta<typeof SiteFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Minimal: Story = {
  args: { description: undefined, groups: [], socialLinks: [] },
};
