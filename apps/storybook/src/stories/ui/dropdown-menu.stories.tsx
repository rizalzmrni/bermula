import { Button } from "@bermula/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bermula/design-system/components/ui/dropdown-menu";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  component: DropdownMenu,
  title: "UI/DropdownMenu",
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Akun saya
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>budi@contoh.com</DropdownMenuLabel>
          <DropdownMenuItem>Profil</DropdownMenuItem>
          <DropdownMenuItem>Keamanan</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Keluar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
