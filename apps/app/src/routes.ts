import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-in/two-factor", "routes/sign-in-two-factor.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("sign-out", "routes/sign-out.tsx"),
  route("verify-email", "routes/verify-email.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  // Semua halaman di dalam layout ini terproteksi (`requireSession` di loader).
  layout("routes/app-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("settings/security", "routes/settings-security.tsx"),
  ]),
] satisfies RouteConfig;
