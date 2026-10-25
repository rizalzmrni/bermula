import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@bermula/design-system/components/ui/alert";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

const meta = {
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
  },
  component: Alert,
  title: "UI/Alert",
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <IconInfoCircle aria-hidden="true" />
      <AlertTitle>Email verifikasi terkirim</AlertTitle>
      <AlertDescription>
        Buka kotak masuk Anda dan klik tautan untuk melanjutkan.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args} className="w-96">
      <IconAlertTriangle aria-hidden="true" />
      <AlertTitle>Pembayaran gagal</AlertTitle>
      <AlertDescription>
        Kartu Anda ditolak. Perbarui metode pembayaran untuk melanjutkan.
      </AlertDescription>
    </Alert>
  ),
};
