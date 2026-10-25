import { data } from "react-router";

import { ErrorPage } from "../components/error-page";
import { pageMeta } from "../lib/site";
import type { Route } from "./+types/not-found";

const HTTP_NOT_FOUND = 404;

// Melempar 404 dari loader agar status HTTP-nya benar (bukan 200 dengan teks
// "tidak ditemukan"), yang penting untuk mesin pencari.
export const loader = () => {
  throw data(null, { status: HTTP_NOT_FOUND });
};

export const meta = ({ location }: Route.MetaArgs) =>
  pageMeta({
    description: "Halaman yang Anda cari tidak ada.",
    noIndex: true,
    path: location.pathname,
    title: "Halaman tidak ditemukan",
  });

// Boundary milik route ini dirender di dalam `site-layout`, sehingga header
// dan footer tetap tampil.
export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <ErrorPage className="flex-1 py-24" error={error} />
);

const NotFound = () => null;

export default NotFound;
