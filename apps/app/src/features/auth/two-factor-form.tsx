import { CheckboxField } from "@bermula/design-system/components/form/checkbox-field";
import { Form } from "@bermula/design-system/components/form/form";
import { OtpField } from "@bermula/design-system/components/form/otp-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { TextField } from "@bermula/design-system/components/form/text-field";
import { Form as RouterForm, Link, useNavigation } from "react-router";

import { getTwoFactorUrl } from "../../lib/redirect";
import { AUTH_LINK_CLASS } from "./auth-layout";
import { FormErrorAlert } from "./form-error-alert";
import {
  BACKUP_CODE_MAX_LENGTH,
  TOTP_CODE_LENGTH,
  TWO_FACTOR_METHOD,
} from "./schemas";
import type { TwoFactorMethod } from "./schemas";

interface TwoFactorFormProps {
  method: TwoFactorMethod;
  redirectTo: string | null;
  formError?: string;
}

/**
 * Langkah kedua login: kode aplikasi authenticator (TOTP) atau kode cadangan.
 * Pergantian cara lewat tautan `?method=`, jadi tetap jalan tanpa JavaScript.
 */
export const TwoFactorForm = ({
  method,
  redirectTo,
  formError,
}: TwoFactorFormProps) => {
  const navigation = useNavigation();
  const pending = navigation.state === "submitting";
  const isTotp = method === TWO_FACTOR_METHOD.totp;

  return (
    <Form render={<RouterForm method="post" />}>
      <FormErrorAlert message={formError} />
      <input name="method" type="hidden" value={method} />
      {redirectTo ? (
        <input name="redirectTo" type="hidden" value={redirectTo} />
      ) : null}
      {isTotp ? (
        <OtpField
          description="Buka aplikasi authenticator Anda dan masukkan 6 digit kodenya."
          label="Kode verifikasi"
          length={TOTP_CODE_LENGTH}
          name="code"
          required
          validationType="numeric"
        />
      ) : (
        <TextField
          autoCapitalize="none"
          autoComplete="one-time-code"
          description="Gunakan salah satu kode cadangan yang Anda simpan saat mengaktifkan 2FA. Setiap kode hanya berlaku sekali."
          label="Kode cadangan"
          maxLength={BACKUP_CODE_MAX_LENGTH}
          name="code"
          required
          spellCheck={false}
        />
      )}
      <CheckboxField
        label="Percayai perangkat ini selama 30 hari"
        name="trustDevice"
      />
      <SubmitButton
        className="w-full"
        pending={pending}
        pendingLabel="Memverifikasi…"
      >
        Verifikasi
      </SubmitButton>
      <p className="text-muted-foreground text-center text-sm">
        <Link
          className={AUTH_LINK_CLASS}
          replace
          to={getTwoFactorUrl({
            method: isTotp ? TWO_FACTOR_METHOD.backupCode : undefined,
            redirectTo,
          })}
        >
          {isTotp ? "Pakai kode cadangan" : "Pakai aplikasi authenticator"}
        </Link>
      </p>
    </Form>
  );
};
