import { Form } from "@bermula/design-system/components/form/form";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { TextField } from "@bermula/design-system/components/form/text-field";
import { Form as RouterForm, useNavigation } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./schemas";

/**
 * Form daftar. Atribut browser memakai batas yang sama dengan `signUpSchema`
 * di action, jadi umpan balik instan dan validasi server tidak berbeda.
 */
export const SignUpForm = ({ formError }: { formError?: string }) => {
  const navigation = useNavigation();
  const pending = navigation.state === "submitting";

  return (
    <Form render={<RouterForm method="post" />}>
      <FormErrorAlert message={formError} />
      <TextField
        autoComplete="name"
        label="Nama"
        maxLength={NAME_MAX_LENGTH}
        name="name"
        required
      />
      <TextField
        autoComplete="email"
        label="Email"
        name="email"
        required
        type="email"
      />
      <PasswordField
        autoComplete="new-password"
        description={`Minimal ${PASSWORD_MIN_LENGTH} karakter.`}
        label="Kata sandi"
        maxLength={PASSWORD_MAX_LENGTH}
        minLength={PASSWORD_MIN_LENGTH}
        name="password"
        required
      />
      <SubmitButton
        className="w-full"
        pending={pending}
        pendingLabel="Memproses…"
      >
        Daftar
      </SubmitButton>
    </Form>
  );
};
