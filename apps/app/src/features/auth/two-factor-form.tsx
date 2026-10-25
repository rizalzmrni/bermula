import { formElementSubmit, useAppForm } from "@bermula/data/form";
import { Form as RouterForm, Link, useSubmit } from "react-router";

import { getTwoFactorUrl } from "../../lib/redirect";
import { AUTH_LINK_CLASS } from "./auth-layout";
import { FormErrorAlert } from "./form-error-alert";
import {
  BACKUP_CODE_MAX_LENGTH,
  TOTP_CODE_LENGTH,
  TWO_FACTOR_METHOD,
  twoFactorFieldsSchemas,
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
  const submit = useSubmit();
  const form = useAppForm({
    defaultValues: { code: "", trustDevice: false },
    validators: { onDynamic: twoFactorFieldsSchemas[method] },
    ...formElementSubmit((element) => submit(element)),
  });
  const isTotp = method === TWO_FACTOR_METHOD.totp;

  return (
    <form.AppForm>
      <form.Form render={<RouterForm method="post" />}>
        <FormErrorAlert message={formError} />
        <input name="method" type="hidden" value={method} />
        {redirectTo ? (
          <input name="redirectTo" type="hidden" value={redirectTo} />
        ) : null}
        <form.AppField name="code">
          {(field) =>
            isTotp ? (
              <field.OtpField
                description="Buka aplikasi authenticator Anda dan masukkan 6 digit kodenya."
                label="Kode verifikasi"
                length={TOTP_CODE_LENGTH}
                required
                validationType="numeric"
              />
            ) : (
              <field.TextField
                autoCapitalize="none"
                autoComplete="one-time-code"
                description="Gunakan salah satu kode cadangan yang Anda simpan saat mengaktifkan 2FA. Setiap kode hanya berlaku sekali."
                label="Kode cadangan"
                maxLength={BACKUP_CODE_MAX_LENGTH}
                required
                spellCheck={false}
              />
            )
          }
        </form.AppField>
        <form.AppField name="trustDevice">
          {(field) => (
            <field.CheckboxField label="Percayai perangkat ini selama 30 hari" />
          )}
        </form.AppField>
        <form.SubmitButton className="w-full" pendingLabel="Memverifikasi…">
          Verifikasi
        </form.SubmitButton>
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
      </form.Form>
    </form.AppForm>
  );
};
