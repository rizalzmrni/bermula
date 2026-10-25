import { ConfirmDialog } from "@bermula/design-system/components/feedback/confirm-dialog";
import { Form } from "@bermula/design-system/components/form/form";
import { OtpField } from "@bermula/design-system/components/form/otp-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { Badge } from "@bermula/design-system/components/ui/badge";
import { Button } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { Separator } from "@bermula/design-system/components/ui/separator";
import { IconShieldCheck, IconShieldOff } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useFetcher } from "react-router";

import { FormErrorAlert } from "../auth/form-error-alert";
import { TOTP_CODE_LENGTH } from "../auth/schemas";
import { isFormError } from "./action-result";
import type {
  SecurityActionResult,
  TwoFactorEnrollment,
} from "./action-result";
import { BackupCodes } from "./backup-codes";
import { PasswordActionForm } from "./password-action-form";
import { QrCode } from "./qr-code";
import { SECURITY_INTENT } from "./schemas";

const SECRET_GROUP = /.{1,4}/gu;

/** Kunci manual dikelompokkan per 4 karakter agar mudah diketik. */
export const formatTotpSecret = (secret: string) =>
  (secret.match(SECRET_GROUP) ?? []).join(" ");

interface EnrollmentStepProps {
  enrollment: TwoFactorEnrollment;
  attempt: number;
  onCancel: () => void;
}

/** Langkah 3: kode cadangan sekali tampil, lalu kembali ke status aktif. */
const BackupCodesStep = ({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) => (
  <div className="flex flex-col gap-4">
    <BackupCodes codes={codes} />
    <Button className="w-full sm:w-fit" onClick={onDone} type="button">
      Selesai, kode sudah saya simpan
    </Button>
  </div>
);

/** Langkah 2 aktivasi: pindai QR, lalu masukkan kode pertama. */
const ScanStep = ({ enrollment, attempt, onCancel }: EnrollmentStepProps) => {
  const verify = useFetcher<SecurityActionResult>({
    key: `two-factor-verify-${attempt}`,
  });

  if (verify.data && "success" in verify.data) {
    return <BackupCodesStep codes={enrollment.backupCodes} onDone={onCancel} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="text-muted-foreground flex list-decimal flex-col gap-1 pl-5 text-sm">
        <li>
          Buka aplikasi authenticator (mis. Google Authenticator, 1Password,
          atau Authy).
        </li>
        <li>Pindai QR code di bawah, atau ketik kunci manualnya.</li>
        <li>Masukkan 6 digit kode yang muncul di aplikasi.</li>
      </ol>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
        <QrCode
          label="QR code untuk aplikasi authenticator"
          value={enrollment.totpURI}
        />
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Kunci manual</span>
          <code className="bg-muted text-foreground rounded-md px-2 py-1 font-mono break-all select-all">
            {formatTotpSecret(enrollment.secret)}
          </code>
        </div>
      </div>
      <Form render={<verify.Form method="post" />}>
        <FormErrorAlert
          message={isFormError(verify.data) ? verify.data.formError : undefined}
        />
        <input
          name="intent"
          type="hidden"
          value={SECURITY_INTENT.verifyTwoFactor}
        />
        <OtpField
          label="Kode verifikasi"
          length={TOTP_CODE_LENGTH}
          name="code"
          required
          validationType="numeric"
        />
        <div className="flex flex-wrap gap-2">
          <SubmitButton
            pending={verify.state === "submitting"}
            pendingLabel="Memverifikasi…"
          >
            Aktifkan 2FA
          </SubmitButton>
          <Button onClick={onCancel} type="button" variant="ghost">
            Batal
          </Button>
        </div>
      </Form>
    </div>
  );
};

/** 2FA aktif: buat ulang kode cadangan atau matikan 2FA. */
const ManageTwoFactor = () => {
  const [attempt, setAttempt] = useState(0);
  const regenerate = useFetcher<SecurityActionResult>({
    key: `two-factor-regenerate-${attempt}`,
  });
  const disable = useFetcher<SecurityActionResult>({
    key: "two-factor-disable",
  });
  const disableForm = useRef<HTMLFormElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">Kode cadangan</h3>
          <p className="text-muted-foreground text-sm">
            Buat kode baru bila kode lama hilang atau hampir habis. Kode lama
            langsung tidak berlaku.
          </p>
        </div>
        {regenerate.data && "backupCodes" in regenerate.data ? (
          <BackupCodesStep
            codes={regenerate.data.backupCodes}
            onDone={() => setAttempt((current) => current + 1)}
          />
        ) : (
          <PasswordActionForm
            fetcher={regenerate}
            intent={SECURITY_INTENT.regenerateBackupCodes}
            pendingLabel="Membuat kode…"
            submitLabel="Buat ulang kode cadangan"
            variant="outline"
          />
        )}
      </section>
      <Separator />
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">Matikan 2FA</h3>
          <p className="text-muted-foreground text-sm">
            Akun hanya dilindungi kata sandi setelah 2FA dimatikan.
          </p>
        </div>
        <PasswordActionForm
          fetcher={disable}
          formRef={disableForm}
          intent={SECURITY_INTENT.disableTwoFactor}
          onRequestSubmit={() => setConfirmOpen(true)}
          pendingLabel="Mematikan…"
          submitLabel="Matikan 2FA"
          variant="destructive"
        />
        <ConfirmDialog
          confirmLabel="Ya, matikan 2FA"
          description="Siapa pun yang tahu kata sandi Anda akan bisa masuk tanpa kode dari aplikasi authenticator. Kode cadangan juga tidak berlaku lagi."
          destructive
          onConfirm={async () => {
            if (disableForm.current) {
              await disable.submit(disableForm.current);
            }
          }}
          onOpenChange={setConfirmOpen}
          open={confirmOpen}
          title="Matikan verifikasi dua langkah?"
        />
      </section>
    </div>
  );
};

/**
 * Kartu verifikasi dua langkah di halaman keamanan. Fetcher aktivasi tinggal
 * di sini (bukan di komponen per status) agar alur aktivasi tetap tampil
 * setelah `enabled` berubah menjadi `true` saat loader direvalidasi, sampai
 * pengguna menyimpan kode cadangannya.
 */
export const TwoFactorSection = ({ enabled }: { enabled: boolean }) => {
  // `attempt` mengganti key fetcher: "Batal"/"Selesai" membuang data rahasia
  // (URI TOTP, kode cadangan) dari memori komponen.
  const [attempt, setAttempt] = useState(0);
  const enable = useFetcher<SecurityActionResult>({
    key: `two-factor-enable-${attempt}`,
  });
  const enrollment =
    enable.data && "enrollment" in enable.data ? enable.data.enrollment : null;

  let content = <ManageTwoFactor />;
  if (enrollment) {
    content = (
      <ScanStep
        attempt={attempt}
        enrollment={enrollment}
        onCancel={() => setAttempt((current) => current + 1)}
      />
    );
  } else if (!enabled) {
    content = (
      <PasswordActionForm
        fetcher={enable}
        intent={SECURITY_INTENT.enableTwoFactor}
        pendingLabel="Memproses…"
        submitLabel="Mulai aktivasi"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <h2>Verifikasi dua langkah (2FA)</h2>
          {enabled ? (
            <Badge>
              <IconShieldCheck aria-hidden="true" />
              Aktif
            </Badge>
          ) : (
            <Badge variant="outline">
              <IconShieldOff aria-hidden="true" />
              Nonaktif
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Selain kata sandi, masuk juga memerlukan kode dari aplikasi
          authenticator di ponsel Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
