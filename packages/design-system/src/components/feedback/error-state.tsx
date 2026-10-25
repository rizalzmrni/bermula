import { Button } from "@bermula/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bermula/design-system/components/ui/empty";
import { Spinner } from "@bermula/design-system/components/ui/spinner";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { cn } from "cn";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: ReactNode;
  /** Pesan ringkas untuk pengguna; jangan tampilkan detail teknis error. */
  description?: ReactNode;
  /** Mis. `query.refetch`; tombol coba lagi hanya tampil bila diisi. */
  onRetry?: () => void;
  /** Mis. `query.isRefetching`; tombol dinonaktifkan dan menampilkan spinner. */
  retrying?: boolean;
  retryLabel?: string;
  className?: string;
}

/** State gagal memuat data, dengan aksi coba lagi. */
export const ErrorState = ({
  title = "Gagal memuat data",
  description = "Terjadi kesalahan. Periksa koneksi Anda, lalu coba lagi.",
  onRetry,
  retrying = false,
  retryLabel = "Coba lagi",
  className,
}: ErrorStateProps) => (
  <Empty className={cn("border-destructive/30 border", className)} role="alert">
    <EmptyHeader>
      <EmptyMedia
        aria-hidden="true"
        className="bg-destructive/10 text-destructive"
        variant="icon"
      >
        <IconAlertTriangle />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
    {onRetry ? (
      <EmptyContent>
        <Button
          aria-busy={retrying || undefined}
          disabled={retrying}
          onClick={onRetry}
          variant="outline"
        >
          {retrying ? (
            <Spinner aria-hidden="true" />
          ) : (
            <IconRefresh aria-hidden="true" />
          )}
          {retryLabel}
        </Button>
      </EmptyContent>
    ) : null}
  </Empty>
);
