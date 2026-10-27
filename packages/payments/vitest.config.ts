import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Test di workerd: verifikasi signature webhook memakai Web Crypto
// (`webhooks.validateEvent` SDK Polar) persis seperti di apps/api.
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
});
