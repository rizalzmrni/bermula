import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-out", "routes/sign-out.tsx"),
  // Semua halaman di dalam layout ini terproteksi (`requireSession` di loader).
  layout("routes/app-layout.tsx", [index("routes/dashboard.tsx")]),
] satisfies RouteConfig;
