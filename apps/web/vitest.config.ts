import { defineConfig } from "vitest/config";

// Sengaja tidak meng-extend `vite.config.ts` (lihat apps/app): test unit
// loader & helper cukup memakai Request/Response standar di Node.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
