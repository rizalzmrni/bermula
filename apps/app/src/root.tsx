import { APP_NAME } from "@bermula/core/brand";
import { DataProvider } from "@bermula/data/provider";
import { DesignSystemProvider } from "@bermula/design-system";
import { Button } from "@bermula/design-system/components/ui/button";
import { fontLinks, fontVariables } from "@bermula/design-system/lib/font";
import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./lib/zod-locale";

import appCss from "./app.css?url";

export const links: Route.LinksFunction = () => [
  ...fontLinks,
  { href: appCss, rel: "stylesheet" },
];

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
        <DataProvider devtools={import.meta.env.DEV}>{children}</DataProvider>
      </DesignSystemProvider>
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
);

const App = () => <Outlet />;

export default App;

const HTTP_NOT_FOUND = 404;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;

const getErrorCopy = (error: unknown) => {
  if (!isRouteErrorResponse(error)) {
    return {
      description: "Terjadi kesalahan tak terduga. Silakan coba lagi.",
      title: "Terjadi kesalahan",
    };
  }
  switch (error.status) {
    case HTTP_NOT_FOUND: {
      return {
        description: "Halaman yang Anda cari tidak ada atau sudah dipindahkan.",
        title: "Halaman tidak ditemukan",
      };
    }
    case HTTP_FORBIDDEN: {
      return {
        description: "Anda tidak punya akses ke halaman ini.",
        title: "Akses ditolak",
      };
    }
    case HTTP_TOO_MANY_REQUESTS: {
      return {
        description:
          "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
        title: "Terlalu banyak permintaan",
      };
    }
    default: {
      return {
        description: "Terjadi kesalahan di server. Silakan coba lagi.",
        title: "Terjadi kesalahan",
      };
    }
  }
};

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  const { title, description } = getErrorCopy(error);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      <Button render={<Link to="/" />}>Kembali ke beranda</Button>
    </main>
  );
};
