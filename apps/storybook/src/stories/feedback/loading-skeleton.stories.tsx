import { LoadingSkeleton } from "@bermula/design-system/components/feedback/loading-skeleton";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  argTypes: {
    variant: {
      control: "select",
      options: ["list", "table", "cards", "text"],
    },
  },
  args: { className: "w-96", variant: "list" },
  component: LoadingSkeleton,
  title: "Feedback/LoadingSkeleton",
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const List: Story = {};

export const Table: Story = {
  args: { columns: 4, rows: 5, variant: "table" },
};

export const Cards: Story = {
  args: { className: "w-[40rem]", variant: "cards" },
};

export const Text: Story = {
  args: { variant: "text" },
};
