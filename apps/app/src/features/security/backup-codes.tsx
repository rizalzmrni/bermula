import { APP_NAME } from "@bermula/core/brand";
import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import { Button } from "@bermula/design-system/components/ui/button";
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconDownload,
} from "@tabler/icons-react";
import { useState } from "react";

const COPY_STATE = {
  copied: "copied",
  failed: "failed",
  idle: "idle",
} as const;
type CopyState = (typeof COPY_STATE)[keyof typeof COPY_STATE];

/** Isi file `.txt` kode cadangan: satu kode per baris + konteks singkat. */
export const formatBackupCodesFile = (codes: readonly string[]) =>
  [
    `Kode cadangan ${APP_NAME}`,
    "Setiap kode hanya bisa dipakai sekali untuk masuk tanpa aplikasi authenticator.",
    "",
    ...codes,
    "",
  ].join("\n");

const downloadBackupCodes = (codes: readonly string[]) => {
  const url = URL.createObjectURL(
    new Blob([formatBackupCodesFile(codes)], { type: "text/plain" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${APP_NAME.toLowerCase()}-kode-cadangan.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

/** Kode cadangan yang baru dibuat; hanya ditampilkan sekali oleh api. */
export const BackupCodes = ({ codes }: { codes: readonly string[] }) => {
  const [copyState, setCopyState] = useState<CopyState>(COPY_STATE.idle);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopyState(COPY_STATE.copied);
    } catch {
      // Clipboard bisa ditolak (izin/konteks tidak aman); arahkan ke unduhan.
      setCopyState(COPY_STATE.failed);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <IconAlertTriangle aria-hidden="true" />
        <AlertDescription>
          Simpan kode ini di tempat aman. Kode tidak akan ditampilkan lagi, dan
          setiap kode hanya berlaku sekali.
        </AlertDescription>
      </Alert>
      <ul
        aria-label="Kode cadangan"
        className="bg-muted text-foreground grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg p-4 font-mono text-sm"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button onClick={copy} type="button" variant="outline">
          {copyState === COPY_STATE.copied ? (
            <IconCheck aria-hidden="true" />
          ) : (
            <IconCopy aria-hidden="true" />
          )}
          {copyState === COPY_STATE.copied ? "Tersalin" : "Salin"}
        </Button>
        <Button
          onClick={() => downloadBackupCodes(codes)}
          type="button"
          variant="outline"
        >
          <IconDownload aria-hidden="true" />
          Unduh .txt
        </Button>
      </div>
      {copyState === COPY_STATE.failed ? (
        <p className="text-destructive text-sm" role="alert">
          Gagal menyalin. Unduh file .txt sebagai gantinya.
        </p>
      ) : null}
    </div>
  );
};
