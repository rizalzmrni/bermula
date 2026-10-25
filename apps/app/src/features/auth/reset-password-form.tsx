import { Form } from "@bermula/design-system/components/form/form";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { Form as RouterForm, useNavigation } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./schemas";

interface ResetPasswordFormProps {
  token: string;
  formError?: string;
}

/** Form kata sandi baru; token dari tautan email dikirim sebagai field tersembunyi. */
export const ResetPasswordForm = ({
  token,
  formError,
}: ResetPasswordFormProps) => {
  const navigation = useNavigation();
  const pending = navigation.state === "submitting";

  return (
    <Form render={<RouterForm method="post" />}>
      <FormErrorAlert message={formError} />
      <input name="token" type="hidden" value={token} />
      <PasswordField
        autoComplete="new-password"
        description={`Minimal ${PASSWORD_MIN_LENGTH} karakter yang tidak Anda pakai di layanan lain.`}
        label="Kata sandi baru"
        maxLength={PASSWORD_MAX_LENGTH}
        minLength={PASSWORD_MIN_LENGTH}
        name="password"
        required
      />
      <SubmitButton
        className="w-full"
        pending={pending}
        pendingLabel="Menyimpan…"
      >
        Simpan kata sandi baru
      </SubmitButton>
    </Form>
  );
};
