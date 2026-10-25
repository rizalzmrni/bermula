import { DesignSystemProvider } from "@bermula/design-system";
import { fontVariables } from "@bermula/design-system/lib/font";
import { DecoratorHelpers } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import "./preview.css";

const THEMES = ["light", "dark"];
const DEFAULT_THEME = "light";

DecoratorHelpers.initializeThemeState(THEMES, DEFAULT_THEME);

// Kelas font dipasang di <body>, bukan di pembungkus story, agar ikut
// terpakai oleh dialog/popover yang di-portal ke <body> (sama seperti root app).
document.body.classList.add(...fontVariables.split(" "));

/**
 * Pembungkus setiap story, setara root layout app: router memori (Link/NavLink
 * dan adapter nuqs butuh router) + DesignSystemProvider. Tema dari toolbar
 * addon-themes diteruskan ke next-themes lewat `forcedTheme`, sehingga kelas
 * `.dark` di <html> tetap dikelola satu pihak.
 */
const withProviders: Decorator = (Story, context) => (
  <MemoryRouter>
    <DesignSystemProvider
      // Fallback: halaman docs/iframe bisa dirender sebelum global terisi;
      // tanpa ini next-themes jatuh ke tema sistem.
      forcedTheme={
        DecoratorHelpers.pluckThemeFromContext(context) || DEFAULT_THEME
      }
      // Skrip anti-kedip next-themes hanya berguna saat SSR; Storybook render
      // di klien, dan React 19 memperingatkan <script> yang dirender klien.
      // Tipe non-JS membuatnya tidak dieksekusi dan tidak diperingatkan.
      scriptProps={{ type: "application/json" }}
    >
      <Story />
    </DesignSystemProvider>
  </MemoryRouter>
);

const preview: Preview = {
  decorators: [withProviders],
  initialGlobals: { theme: DEFAULT_THEME },
  parameters: {
    controls: { expanded: true },
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default preview;
