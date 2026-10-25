import { formElementSubmit, useAppForm } from "@bermula/data/form";
import { Form as RouterForm, useSubmit } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
} from "./schemas";

interface ResetPasswordFormProps {
  token: string;
  formError?: string;
}

/** Form kata sandi baru; token dari tautan email dikirim sebagai field tersembunyi. */
export const ResetPasswordForm = ({
  token,
  formError,
}: ResetPasswordFormProps) => {
  const submit = useSubmit();
  const form = useAppForm({
    defaultValues: { password: "", token },
    validators: { onDynamic: resetPasswordSchema },
    ...formElementSubmit((element) => submit(element)),
  });

  return (
    <form.AppForm>
      <form.Form render={<RouterForm method="post" />}>
        <FormErrorAlert message={formError} />
        <input name="token" type="hidden" value={token} />
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              autoComplete="new-password"
              description={`Minimal ${PASSWORD_MIN_LENGTH} karakter yang tidak Anda pakai di layanan lain.`}
              label="Kata sandi baru"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          )}
        </form.AppField>
        <form.SubmitButton className="w-full" pendingLabel="Menyimpan…">
          Simpan kata sandi baru
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
