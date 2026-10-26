import type { Meta, StoryObj } from "@storybook/react-vite";

// Pasangan token permukaan/teks dari DESIGN.md ("Peta Token Warna"). Kelas
// ditulis lengkap (bukan dirakit dari string) agar terdeteksi Tailwind.
const SURFACE_TOKENS = [
  { className: "bg-background text-foreground", name: "background" },
  { className: "bg-card text-card-foreground", name: "card" },
  { className: "bg-popover text-popover-foreground", name: "popover" },
  { className: "bg-primary text-primary-foreground", name: "primary" },
  { className: "bg-secondary text-secondary-foreground", name: "secondary" },
  { className: "bg-muted text-muted-foreground", name: "muted" },
  { className: "bg-accent text-accent-foreground", name: "accent" },
  {
    className: "bg-destructive text-destructive-foreground",
    name: "destructive",
  },
] as const;

const CHART_TOKENS = [
  { className: "bg-chart-1", name: "chart-1" },
  { className: "bg-chart-2", name: "chart-2" },
  { className: "bg-chart-3", name: "chart-3" },
  { className: "bg-chart-4", name: "chart-4" },
  { className: "bg-chart-5", name: "chart-5" },
] as const;

const ColorTokens = () => (
  <div className="flex w-full max-w-3xl flex-col gap-8">
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Permukaan & teks</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SURFACE_TOKENS.map(({ className, name }) => (
          <li
            className={`flex h-20 flex-col justify-end rounded-lg border p-3 text-sm font-medium ${className}`}
            key={name}
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Grafik</h2>
      <ul className="grid grid-cols-5 gap-3">
        {CHART_TOKENS.map(({ className, name }) => (
          <li className="flex flex-col gap-2 text-sm" key={name}>
            <span className={`h-12 rounded-lg ${className}`} />
            {name}
          </li>
        ))}
      </ul>
    </section>
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Garis & fokus</h2>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg border p-3">border</span>
        <span className="border-input rounded-lg border p-3">input</span>
        <span className="ring-ring rounded-lg p-3 ring-3">ring</span>
      </div>
    </section>
  </div>
);

const meta = {
  component: ColorTokens,
  parameters: { layout: "padded" },
  // Halaman referensi; tanpa autodocs karena tidak punya props.
  tags: ["!autodocs"],
  title: "Fondasi/Warna",
} satisfies Meta<typeof ColorTokens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tokens: Story = {};
