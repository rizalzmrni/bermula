import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Dibaca otomatis oleh `@storybook/react-vite`; Tailwind v4 lewat plugin Vite
// yang sama dengan apps/app & apps/web.
export default defineConfig({
  plugins: [tailwindcss()],
});
