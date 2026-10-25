import { Logo } from "@bermula/design-system/components/layout/logo";
import { MobileNav } from "@bermula/design-system/components/navigation/mobile-nav";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SITE_ITEMS } from "../layout/navigation-data";

const meta = {
  args: { items: SITE_ITEMS, title: <Logo /> },
  component: MobileNav,
  title: "Navigasi/MobileNav",
} satisfies Meta<typeof MobileNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
