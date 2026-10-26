import { ConfirmDialog } from "@bermula/design-system/components/feedback/confirm-dialog";
import { Button } from "@bermula/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";

const SIMULATED_DELAY_MS = 1500;

// Simulasi request lambat agar spinner terlihat. Browser tidak punya
// `setTimeout` versi Promise, jadi Promise dibuat manual.
const wait = () =>
  // oxlint-disable-next-line promise/avoid-new
  new Promise<void>((resolve) => {
    setTimeout(resolve, SIMULATED_DELAY_MS);
  });

const meta = {
  args: {
    confirmLabel: "Hapus",
    description: "Dokumen akan dihapus permanen dan tidak bisa dipulihkan.",
    destructive: true,
    // Promise ditunggu: tombol menampilkan spinner sampai selesai.
    onConfirm: wait,
    title: "Hapus dokumen?",
    trigger: <Button variant="destructive">Hapus dokumen</Button>,
  },
  component: ConfirmDialog,
  title: "Feedback/ConfirmDialog",
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Destructive: Story = {};

// Promise ditolak: dialog tetap terbuka dan menampilkan `errorMessage`.
export const Failing: Story = {
  args: {
    errorMessage: "Gagal menghapus dokumen. Silakan coba lagi.",
    onConfirm: async () => {
      await wait();
      throw new Error("Simulated failure");
    },
  },
};
