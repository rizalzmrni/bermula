import { Analytics } from "@bermula/analytics/analytics";
import { readConsent } from "@bermula/analytics/consent";
import { APP_NAME } from "@bermula/core/brand";
import { DesignSystemProvider } from "@bermula/design-system";
import { fontLinks, fontVariables } from "@bermula/design-system/lib/font";
import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { ErrorPage } from "./components/error-page";
import { getAnalyticsConfig } from "./lib/analytics";
import { PATHS } from "./lib/paths";

import appCss from "./app.css?url";

export const links: Route.LinksFunction = () => [
  ...fontLinks,
  { href: appCss, rel: "stylesheet" },
];

/** Pilihan cookie analitik dibaca saat SSR, jadi banner tidak berkedip. */
export const loader = ({ request }: Route.LoaderArgs) => ({
  consent: readConsent(request.headers.get("Cookie")),
});

/** Persetujuan dari root loader; `null` bila belum memilih atau loader gagal. */
export const useConsent = () =>
  useRouteLoaderData<typeof loader>("root")?.consent ?? null;

// Cadangan; setiap halaman menimpanya dengan `pageMeta` (lib/site).
export const meta = () => [{ title: APP_NAME }];

export const Layout = ({ children }: { children: ReactNode }) => (
  // next-themes mengubah kelas <html> sebelum hidrasi.
  <html lang="id" suppressHydrationWarning>
    <head>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <Meta />
      <Links />
    </head>
    <body className={fontVariables}>
      <DesignSystemProvider showTailwindIndicator={import.meta.env.DEV}>
        <Analytics
          config={getAnalyticsConfig()}
          consent={useConsent()}
          privacyHref={PATHS.privacy}
        >
          {children}
        </Analytics>
      </DesignSystemProvider>
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
);

const App = () => <Outlet />;

export default App;

// Hanya untuk error di luar layout situs; 404 halaman ditangani
// `routes/not-found.tsx` agar tetap di dalam header & footer.
export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <ErrorPage className="min-h-svh" error={error} />
);
