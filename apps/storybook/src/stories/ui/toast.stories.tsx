import { Button } from "@bermula/design-system/components/ui/button";
import { toast } from "@bermula/design-system/components/ui/toast";
import type { Meta, StoryObj } from "@storybook/react-vite";

// Toaster sudah dipasang oleh DesignSystemProvider (decorator); story ini
// hanya memicu toast lewat manajer global `toast`.
const ToastDemo = () => (
  <Button
    onClick={() =>
      toast.add({
        description: "Perubahan profil Anda sudah disimpan.",
        title: "Tersimpan",
      })
    }
    variant="outline"
  >
    Tampilkan toast
  </Button>
);

const meta = {
  component: ToastDemo,
  tags: ["!autodocs"],
  title: "UI/Toast",
} satisfies Meta<typeof ToastDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
