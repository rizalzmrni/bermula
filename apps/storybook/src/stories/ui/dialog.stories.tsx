import { Button } from "@bermula/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bermula/design-system/components/ui/dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  component: Dialog,
  title: "UI/Dialog",
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger render={<Button variant="outline" />}>
        Undang anggota
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undang anggota</DialogTitle>
          <DialogDescription>
            Undangan berlaku 48 jam dan dikirim ke email penerima.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <DialogClose render={<Button />}>Kirim undangan</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
