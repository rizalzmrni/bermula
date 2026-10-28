import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-in/two-factor", "routes/sign-in-two-factor.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("sign-out", "routes/sign-out.tsx"),
  // Action persetujuan cookie; publik karena banner juga tampil di halaman login.
  route("consent", "routes/consent.ts"),
  route("verify-email", "routes/verify-email.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  // Semua halaman di dalam layout ini terproteksi (`requireSession` di loader).
  layout("routes/app-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("settings/security", "routes/settings-security.tsx"),
    route("settings/cookies", "routes/settings-cookies.tsx"),
    route("organizations/new", "routes/organizations-new.tsx"),
    // Tautan email undangan (`ACCEPT_INVITATION_PATH` di packages/auth).
    route("accept-invitation/:invitationId", "routes/accept-invitation.tsx"),
    // Dashboard organisasi: konteks dari `:slug`, bukan organisasi aktif sesi.
    route("o/:slug", "routes/org-layout.tsx", [
      index("routes/org-dashboard.tsx"),
      route("members", "routes/org-members.tsx"),
      route("billing", "routes/org-billing.tsx"),
      route("settings", "routes/org-settings.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
