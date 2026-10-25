import { Form } from "@bermula/design-system/components/form/form";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import type { ComponentProps, ReactNode, Ref } from "react";
import type { FetcherWithComponents } from "react-router";

import { FormErrorAlert } from "../auth/form-error-alert";
import { isFormError } from "./action-result";
import type { SecurityActionResult } from "./action-result";
import type { SecurityIntent } from "./schemas";

interface PasswordActionFormProps {
  fetcher: FetcherWithComponents<SecurityActionResult>;
  intent: SecurityIntent;
  submitLabel: ReactNode;
  pendingLabel: string;
  variant?: ComponentProps<typeof SubmitButton>["variant"];
  /** Dipanggil sebagai ganti submit langsung (mis. membuka dialog konfirmasi). */
  onRequestSubmit?: (form: HTMLFormElement) => void;
  formRef?: Ref<HTMLFormElement>;
}

/** Aksi keamanan yang dikonfirmasi ulang dengan kata sandi saat ini. */
export const PasswordActionForm = ({
  fetcher,
  intent,
  submitLabel,
  pendingLabel,
  variant,
  onRequestSubmit,
  formRef,
}: PasswordActionFormProps) => (
  <Form
    onSubmit={
      onRequestSubmit
        ? (event) => {
            event.preventDefault();
            onRequestSubmit(event.currentTarget);
          }
        : undefined
    }
    render={<fetcher.Form method="post" ref={formRef} />}
  >
    <FormErrorAlert
      message={isFormError(fetcher.data) ? fetcher.data.formError : undefined}
    />
    <input name="intent" type="hidden" value={intent} />
    <PasswordField
      autoComplete="current-password"
      label="Kata sandi saat ini"
      name="password"
      required
    />
    <SubmitButton
      className="w-full sm:w-fit"
      pending={fetcher.state === "submitting"}
      pendingLabel={pendingLabel}
      variant={variant}
    >
      {submitLabel}
    </SubmitButton>
  </Form>
);
