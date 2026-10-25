import { formElementSubmit, useAppForm } from "@bermula/data/form";
import { Form as RouterForm, useSubmit } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  signUpSchema,
} from "./schemas";

/**
 * Form daftar. Divalidasi `signUpSchema` yang sama dengan action, dan
 * atribut browser memakai batas yang sama untuk kiriman tanpa JavaScript.
 */
export const SignUpForm = ({ formError }: { formError?: string }) => {
  const submit = useSubmit();
  const form = useAppForm({
    defaultValues: { email: "", name: "", password: "" },
    validators: { onDynamic: signUpSchema },
    ...formElementSubmit((element) => submit(element)),
  });

  return (
    <form.AppForm>
      <form.Form render={<RouterForm method="post" />}>
        <FormErrorAlert message={formError} />
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              autoComplete="name"
              label="Nama"
              maxLength={NAME_MAX_LENGTH}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              autoComplete="email"
              label="Email"
              required
              type="email"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              autoComplete="new-password"
              description={`Minimal ${PASSWORD_MIN_LENGTH} karakter.`}
              label="Kata sandi"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          )}
        </form.AppField>
        <form.SubmitButton className="w-full" pendingLabel="Memproses…">
          Daftar
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
