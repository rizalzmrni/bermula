import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  route("masuk", "routes/masuk.tsx"),
  route("keluar", "routes/keluar.tsx"),
  // Semua halaman di dalam layout ini terproteksi (`requireSession` di loader).
  layout("routes/app-layout.tsx", [index("routes/dashboard.tsx")]),
] satisfies RouteConfig;
