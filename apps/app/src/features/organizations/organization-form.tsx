import {
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_SLUG_MAX_LENGTH,
  ORGANIZATION_SLUG_MIN_LENGTH,
  organizationInputSchema,
  toOrganizationSlug,
} from "@bermula/core/organizations";
import type { OrganizationInput } from "@bermula/core/organizations";
import { formElementSubmit, useAppForm } from "@bermula/data/form";
import type { ReactElement, ReactNode } from "react";

import { FormErrorAlert } from "../auth/form-error-alert";

interface OrganizationFormProps {
  /** `<RouterForm method="post" />` atau `<fetcher.Form method="post" />`. */
  render: ReactElement;
  submit: (form: HTMLFormElement) => Promise<unknown>;
  defaultValues?: OrganizationInput;
  /** Alamat mengikuti nama sampai pengguna mengubahnya sendiri (form baru). */
  suggestSlug?: boolean;
  formError?: string;
  /** Field tersembunyi tambahan, mis. `intent`. */
  children?: ReactNode;
  submitLabel: string;
  disabled?: boolean;
}

const EMPTY: OrganizationInput = { name: "", slug: "" };

/** Field nama + alamat (`/o/:slug`) dengan skema yang sama seperti hook server. */
export const OrganizationForm = ({
  render,
  submit,
  defaultValues = EMPTY,
  suggestSlug = false,
  formError,
  children,
  submitLabel,
  disabled = false,
}: OrganizationFormProps) => {
  const form = useAppForm({
    defaultValues,
    validators: { onDynamic: organizationInputSchema },
    ...formElementSubmit(submit),
  });

  return (
    <form.AppForm>
      <form.Form render={render}>
        <FormErrorAlert message={formError} />
        {children}
        <form.AppField
          listeners={{
            onChange: ({ value }) => {
              if (suggestSlug && !form.getFieldMeta("slug")?.isTouched) {
                // Tanpa mengubah meta: alamat tetap dianggap belum disentuh.
                form.setFieldValue("slug", toOrganizationSlug(value), {
                  dontUpdateMeta: true,
                });
              }
            },
          }}
          name="name"
        >
          {(field) => (
            <field.TextField
              autoComplete="organization"
              disabled={disabled}
              label="Nama organisasi"
              maxLength={ORGANIZATION_NAME_MAX_LENGTH}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="slug">
          {(field) => (
            <field.TextField
              autoCapitalize="none"
              autoComplete="off"
              description={`Dipakai di alamat dashboard: /o/${field.state.value || "nama-organisasi"}`}
              disabled={disabled}
              label="Alamat"
              maxLength={ORGANIZATION_SLUG_MAX_LENGTH}
              minLength={ORGANIZATION_SLUG_MIN_LENGTH}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              spellCheck={false}
            />
          )}
        </form.AppField>
        {disabled ? null : (
          <form.SubmitButton
            className="w-full sm:w-fit"
            pendingLabel="Menyimpan…"
          >
            {submitLabel}
          </form.SubmitButton>
        )}
      </form.Form>
    </form.AppForm>
  );
};
