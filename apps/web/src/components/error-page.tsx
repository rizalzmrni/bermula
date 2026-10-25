import { Button } from "@bermula/design-system/components/ui/button";
import { cn } from "cn";
import { isRouteErrorResponse, Link } from "react-router";

const HTTP_NOT_FOUND = 404;

const getErrorCopy = (error: unknown) => {
  if (isRouteErrorResponse(error) && error.status === HTTP_NOT_FOUND) {
    return {
      description: "Halaman yang Anda cari tidak ada atau sudah dipindahkan.",
      title: "Halaman tidak ditemukan",
    };
  }
  return {
    description: "Terjadi kesalahan tak terduga. Silakan coba lagi.",
    title: "Terjadi kesalahan",
  };
};

interface ErrorPageProps {
  error: unknown;
  className?: string;
}

/** Isi halaman error/404; dipakai ErrorBoundary root dan route catch-all. */
export const ErrorPage = ({ error, className }: ErrorPageProps) => {
  const { description, title } = getErrorCopy(error);

  return (
    <main
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-4 text-center",
        className
      )}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      <Button render={<Link to="/" />}>Kembali ke beranda</Button>
    </main>
  );
};
