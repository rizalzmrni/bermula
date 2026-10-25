import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bermula/design-system/components/ui/tabs";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  args: { defaultValue: "profil" },
  component: Tabs,
  title: "UI/Tabs",
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args} className="w-96">
      <TabsList>
        <TabsTrigger value="profil">Profil</TabsTrigger>
        <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
        <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
      </TabsList>
      <TabsContent className="text-muted-foreground text-sm" value="profil">
        Nama, foto, dan email akun Anda.
      </TabsContent>
      <TabsContent className="text-muted-foreground text-sm" value="keamanan">
        Kata sandi dan autentikasi dua faktor.
      </TabsContent>
      <TabsContent className="text-muted-foreground text-sm" value="tagihan">
        Paket langganan dan riwayat pembayaran.
      </TabsContent>
    </Tabs>
  ),
};
