import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@bermula/design-system/components/ui/alert-dialog";
import { Spinner } from "@bermula/design-system/components/ui/spinner";
import { useState } from "react";
import type { ReactElement, ReactNode } from "react";

interface ConfirmDialogProps {
  title: ReactNode;
  /** Jelaskan akibatnya, mis. "Proyek dan semua filenya dihapus permanen." */
  description?: ReactNode;
  /**
   * Dijalankan saat dikonfirmasi. Bila mengembalikan Promise (mis.
   * `mutation.mutateAsync`), dialog menunggu: tetap terbuka dengan spinner,
   * tertutup bila berhasil, dan menampilkan `errorMessage` bila gagal.
   */
  onConfirm: () => unknown;
  /** Elemen pembuka dialog, mis. `<Button variant="destructive" />`. */
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Untuk aksi merusak (hapus, cabut akses): tombol memakai `destructive`. */
  destructive?: boolean;
  errorMessage?: string;
}

/** Dialog konfirmasi sebelum aksi penting atau yang tidak bisa dibatalkan. */
export const ConfirmDialog = ({
  title,
  description,
  onConfirm,
  trigger,
  open: openProp,
  onOpenChange,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  destructive = false,
  errorMessage = "Tindakan gagal. Silakan coba lagi.",
}: ConfirmDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const open = openProp ?? uncontrolledOpen;

  const changeOpen = (next: boolean) => {
    setFailed(false);
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const confirm = async () => {
    setPending(true);
    setFailed(false);
    try {
      await onConfirm();
      setPending(false);
      changeOpen(false);
    } catch {
      // Dialog tetap terbuka agar pengguna bisa mencoba lagi atau membatalkan;
      // pelaporan error ke observability tanggung jawab pemanggil.
      setPending(false);
      setFailed(true);
    }
  };

  return (
    <AlertDialog
      onOpenChange={(next) => {
        // Jangan biarkan dialog ditutup (Esc/klik luar) saat aksi berjalan.
        if (!pending) {
          changeOpen(next);
        }
      }}
      open={open}
    >
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {failed ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            aria-busy={pending || undefined}
            disabled={pending}
            onClick={confirm}
            variant={destructive ? "destructive" : "default"}
          >
            {pending ? <Spinner aria-hidden="true" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
