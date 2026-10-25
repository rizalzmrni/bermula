import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Lihat apps/app: tanpa entri ini Vite mem-bundle ulang dependensi route di
  // tengah sesi dan browser memuat dua salinan React.
  optimizeDeps: { entries: ["src/root.tsx", "src/routes/**/*.tsx"] },
  plugins: [
    // Environment `ssr` React Router dijalankan di workerd, bukan Node.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
  ],
  // apps/app memakai 5173; port tetap agar cocok dengan `VITE_WEB_URL` dan
  // `WEB_URL`/`CORS_ORIGINS` di apps/api.
  server: { port: 5174, strictPort: true },
});
