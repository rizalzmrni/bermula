import type { Config } from "@react-router/dev/config";

export default {
  // `src/` (bukan default `app/`) agar seragam dengan paket dan app lain.
  appDirectory: "src",
  ssr: true,
} satisfies Config;
