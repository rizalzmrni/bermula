import { Form } from "@bermula/design-system/components/form/form";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { TextField } from "@bermula/design-system/components/form/text-field";
import { Form as RouterForm, useNavigation } from "react-router";

import { FormErrorAlert } from "./form-error-alert";

interface ForgotPasswordFormProps {
  defaultEmail?: string;
  formError?: string;
}

/** Form permintaan tautan reset kata sandi (action `/forgot-password`). */
export const ForgotPasswordForm = ({
  defaultEmail,
  formError,
}: ForgotPasswordFormProps) => {
  const navigation = useNavigation();
  const pending = navigation.state === "submitting";

  return (
    <Form render={<RouterForm action="/forgot-password" method="post" />}>
      <FormErrorAlert message={formError} />
      <TextField
        autoComplete="email"
        defaultValue={defaultEmail}
        label="Email"
        name="email"
        required
        type="email"
      />
      <SubmitButton
        className="w-full"
        pending={pending}
        pendingLabel="Mengirim…"
      >
        Kirim tautan reset
      </SubmitButton>
    </Form>
  );
};
