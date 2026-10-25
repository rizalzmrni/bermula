import { formElementSubmit, useAppForm } from "@bermula/data/form";
import { Form as RouterForm, useSubmit } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import { forgotPasswordSchema } from "./schemas";

interface ForgotPasswordFormProps {
  defaultEmail?: string;
  formError?: string;
}

/** Form permintaan tautan reset kata sandi (action `/forgot-password`). */
export const ForgotPasswordForm = ({
  defaultEmail = "",
  formError,
}: ForgotPasswordFormProps) => {
  const submit = useSubmit();
  const form = useAppForm({
    defaultValues: { email: defaultEmail },
    validators: { onDynamic: forgotPasswordSchema },
    ...formElementSubmit((element) => submit(element)),
  });

  return (
    <form.AppForm>
      <form.Form
        render={<RouterForm action="/forgot-password" method="post" />}
      >
        <FormErrorAlert message={formError} />
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
        <form.SubmitButton className="w-full" pendingLabel="Mengirim…">
          Kirim tautan reset
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
