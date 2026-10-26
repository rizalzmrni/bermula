import { Logo } from "@bermula/design-system/components/layout/logo";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: { showName: true },
  component: Logo,
  title: "Layout/Logo",
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MarkOnly: Story = {
  args: { showName: false },
};
