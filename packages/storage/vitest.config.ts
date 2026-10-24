import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Semua test berjalan di workerd: binding R2 lokal (miniflare) dan Web Crypto
// yang sama dengan produksi untuk penandatanganan presigned URL.
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
});
