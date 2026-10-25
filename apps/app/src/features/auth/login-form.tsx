import { formElementSubmit, useAppForm } from "@bermula/data/form";
import { Link, Form as RouterForm, useSubmit } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import { signInSchema } from "./schemas";

interface LoginFormProps {
  redirectTo: string | null;
  formError?: string;
}

/**
 * Form login. Atribut browser dan `signInSchema` divalidasi di klien; bila
 * lolos, elemen form dikirim ke action route. Tanpa JavaScript, `RouterForm`
 * tetap mengirim POST biasa ke action yang sama.
 */
export const LoginForm = ({ redirectTo, formError }: LoginFormProps) => {
  const submit = useSubmit();
  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    validators: { onDynamic: signInSchema },
    ...formElementSubmit((element) => submit(element)),
  });

  return (
    <form.AppForm>
      <form.Form render={<RouterForm method="post" />}>
        <FormErrorAlert message={formError} />
        {redirectTo ? (
          <input name="redirectTo" type="hidden" value={redirectTo} />
        ) : null}
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
        <div className="flex flex-col gap-2">
          <form.AppField name="password">
            {(field) => (
              <field.PasswordField
                autoComplete="current-password"
                label="Kata sandi"
                required
              />
            )}
          </form.AppField>
          <Link
            className="text-muted-foreground self-end text-sm underline underline-offset-4 hover:no-underline"
            to="/forgot-password"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <form.SubmitButton className="w-full" pendingLabel="Memproses…">
          Masuk
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
