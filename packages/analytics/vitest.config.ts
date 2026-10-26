import { defineConfig } from "vitest/config";

// Pelacak berjalan di browser (script GA, posthog-js); test memakai DOM tiruan.
// happy-dom tidak pernah mengunduh script eksternal (tanpa jaringan); script
// GA dianggap berhasil dimuat agar log test tidak penuh error.
export default defineConfig({
  test: {
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: {
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
  },
});
