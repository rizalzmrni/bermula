import { defineConfig } from "vitest/config";

// Sengaja tidak meng-extend `vite.config.ts`: plugin cloudflare & reactRouter
// menjalankan dev server workerd dan memproses route, yang tidak dibutuhkan
// untuk test unit helper loader/action (cukup Request/Response standar di Node).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
