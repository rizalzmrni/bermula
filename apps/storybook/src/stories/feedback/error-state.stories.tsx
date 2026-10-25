import { ErrorState } from "@bermula/design-system/components/feedback/error-state";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  args: { onRetry: fn(), retrying: false },
  component: ErrorState,
  title: "Feedback/ErrorState",
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Mis. saat `query.isRefetching`; tombol coba lagi dinonaktifkan.
export const Retrying: Story = {
  args: { retrying: true },
};

export const CustomCopy: Story = {
  args: {
    description: "Server penyimpanan tidak merespons. Coba beberapa saat lagi.",
    title: "Gagal memuat dokumen",
  },
};
