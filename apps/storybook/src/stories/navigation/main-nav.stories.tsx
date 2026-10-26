import { MainNav } from "@bermula/design-system/components/navigation/main-nav";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SITE_ITEMS } from "../layout/navigation-data";

const meta = {
  args: { items: SITE_ITEMS },
  component: MainNav,
  title: "Navigasi/MainNav",
} satisfies Meta<typeof MainNav>;

export default meta;

type Story = StoryObj<typeof meta>;

// "Beranda" aktif karena router memori di decorator berada di "/".
export const Default: Story = {};
