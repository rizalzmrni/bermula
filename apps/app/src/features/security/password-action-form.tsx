import { formElementSubmit, useAppForm } from "@bermula/data/form";
import type { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import type { ComponentProps, ReactNode } from "react";
import type { FetcherWithComponents } from "react-router";

import { FormErrorAlert } from "../auth/form-error-alert";
import { isFormError } from "./action-result";
import type { SecurityActionResult } from "./action-result";
import { currentPasswordFieldsSchema } from "./schemas";
import type { SecurityIntent } from "./schemas";

interface PasswordActionFormProps {
  fetcher: FetcherWithComponents<SecurityActionResult>;
  intent: SecurityIntent;
  submitLabel: ReactNode;
  pendingLabel: string;
  variant?: ComponentProps<typeof SubmitButton>["variant"];
  /**
   * Dipanggil dengan elemen form yang sudah valid sebagai ganti submit
   * langsung (mis. membuka dialog konfirmasi yang lalu mengirimnya).
   */
  onRequestSubmit?: (form: HTMLFormElement) => void;
}

/** Aksi keamanan yang dikonfirmasi ulang dengan kata sandi saat ini. */
export const PasswordActionForm = ({
  fetcher,
  intent,
  submitLabel,
  pendingLabel,
  variant,
  onRequestSubmit,
}: PasswordActionFormProps) => {
  const form = useAppForm({
    defaultValues: { password: "" },
    validators: { onDynamic: currentPasswordFieldsSchema },
    ...formElementSubmit(async (element) => {
      if (onRequestSubmit) {
        onRequestSubmit(element);
        return;
      }
      await fetcher.submit(element);
    }),
  });

  return (
    <form.AppForm>
      <form.Form render={<fetcher.Form method="post" />}>
        <FormErrorAlert
          message={
            isFormError(fetcher.data) ? fetcher.data.formError : undefined
          }
        />
        <input name="intent" type="hidden" value={intent} />
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              autoComplete="current-password"
              label="Kata sandi saat ini"
              required
            />
          )}
        </form.AppField>
        <form.SubmitButton
          className="w-full sm:w-fit"
          pendingLabel={pendingLabel}
          variant={variant}
        >
          {submitLabel}
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
