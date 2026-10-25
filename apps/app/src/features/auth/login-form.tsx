import { Form } from "@bermula/design-system/components/form/form";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { TextField } from "@bermula/design-system/components/form/text-field";
import { Form as RouterForm, useNavigation } from "react-router";

import { FormErrorAlert } from "./form-error-alert";

interface LoginFormProps {
  redirectTo: string | null;
  formError?: string;
}

/**
 * Form login. `Form` design-system memvalidasi atribut browser dulu; bila lolos,
 * `RouterForm` mengirimnya ke action route (tetap jalan tanpa JavaScript).
 */
export const LoginForm = ({ redirectTo, formError }: LoginFormProps) => {
  const navigation = useNavigation();
  const pending = navigation.state === "submitting";

  return (
    <Form render={<RouterForm method="post" />}>
      <FormErrorAlert message={formError} />
      {redirectTo ? (
        <input name="redirectTo" type="hidden" value={redirectTo} />
      ) : null}
      <TextField
        autoComplete="email"
        label="Email"
        name="email"
        required
        type="email"
      />
      <PasswordField
        autoComplete="current-password"
        label="Kata sandi"
        name="password"
        required
      />
      <SubmitButton
        className="w-full"
        pending={pending}
        pendingLabel="Memproses…"
      >
        Masuk
      </SubmitButton>
    </Form>
  );
};
