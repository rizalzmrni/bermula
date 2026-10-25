import { APP_NAME } from "@bermula/core/brand";
import { DesignSystemProvider } from "@bermula/design-system";
import { fontLinks, fontVariables } from "@bermula/design-system/lib/font";
import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import { ErrorPage } from "./components/error-page";

import appCss from "./app.css?url";

export const links: Route.LinksFunction = () => [
  ...fontLinks,
  { href: appCss, rel: "stylesheet" },
];

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
        {children}
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
