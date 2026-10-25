import { ThemeToggle } from "@bermula/design-system/components/theme-toggle";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  component: ThemeToggle,
  // Di Storybook tema dikunci toolbar (`forcedTheme`), jadi tombol ini tidak
  // mengubah tampilan; story hanya menampilkan bentuknya.
  title: "Layout/ThemeToggle",
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
