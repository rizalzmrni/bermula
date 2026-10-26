import { Button } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  component: Card,
  title: "UI/Card",
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Penyimpanan</CardTitle>
        <CardDescription>Pemakaian ruang organisasi Anda.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Kelola
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">2,4 GB</p>
        <p className="text-muted-foreground text-sm">dari 50 GB</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Tingkatkan paket</Button>
      </CardFooter>
    </Card>
  ),
};
