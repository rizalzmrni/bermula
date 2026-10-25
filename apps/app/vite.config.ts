import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Tanpa ini Vite baru menemukan dependensi route (mis. `@base-ui/react/*`
  // dari design-system) saat halaman dibuka, lalu mem-bundle ulang di tengah
  // sesi: browser memuat dua salinan React ("Invalid hook call").
  optimizeDeps: { entries: ["src/root.tsx", "src/routes/**/*.tsx"] },
  plugins: [
    // Environment `ssr` React Router dijalankan di workerd, bukan Node.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
  ],
});
