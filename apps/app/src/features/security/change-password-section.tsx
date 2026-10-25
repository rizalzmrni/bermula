import { formElementSubmit, useAppForm } from "@bermula/data/form";
import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { IconCircleCheck } from "@tabler/icons-react";
import { useFetcher } from "react-router";
import type { FetcherWithComponents } from "react-router";

import { FormErrorAlert } from "../auth/form-error-alert";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../auth/schemas";
import { isFormError } from "./action-result";
import type { SecurityActionResult } from "./action-result";
import { changePasswordFieldsSchema, SECURITY_INTENT } from "./schemas";

interface ChangePasswordFormProps {
  fetcher: FetcherWithComponents<SecurityActionResult>;
  changed: boolean;
}

const ChangePasswordForm = ({ fetcher, changed }: ChangePasswordFormProps) => {
  const form = useAppForm({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: "",
      revokeOtherSessions: true,
    },
    validators: { onDynamic: changePasswordFieldsSchema },
    ...formElementSubmit((element) => fetcher.submit(element)),
  });

  return (
    <form.AppForm>
      <form.Form render={<fetcher.Form method="post" />}>
        {changed ? (
          <Alert>
            <IconCircleCheck aria-hidden="true" />
            <AlertDescription>Kata sandi berhasil diganti.</AlertDescription>
          </Alert>
        ) : (
          <FormErrorAlert
            message={
              isFormError(fetcher.data) ? fetcher.data.formError : undefined
            }
          />
        )}
        <input
          name="intent"
          type="hidden"
          value={SECURITY_INTENT.changePassword}
        />
        <form.AppField name="currentPassword">
          {(field) => (
            <field.PasswordField
              autoComplete="current-password"
              label="Kata sandi saat ini"
              required
            />
          )}
        </form.AppField>
        <form.AppField name="newPassword">
          {(field) => (
            <field.PasswordField
              autoComplete="new-password"
              label="Kata sandi baru"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => (
            <field.PasswordField
              autoComplete="new-password"
              label="Ulangi kata sandi baru"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="revokeOtherSessions">
          {(field) => (
            <field.CheckboxField
              description="Disarankan bila Anda curiga kata sandi lama diketahui orang lain."
              label="Keluarkan akun dari semua perangkat lain"
            />
          )}
        </form.AppField>
        <form.SubmitButton
          className="w-full sm:w-fit"
          pendingLabel="Menyimpan…"
        >
          Ganti kata sandi
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};

/** Kartu ganti kata sandi di halaman keamanan. */
export const ChangePasswordSection = () => {
  const fetcher = useFetcher<SecurityActionResult>({ key: "change-password" });
  const changed = fetcher.data !== undefined && "success" in fetcher.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Kata sandi</h2>
        </CardTitle>
        <CardDescription>
          Gunakan minimal {PASSWORD_MIN_LENGTH} karakter yang tidak Anda pakai
          di layanan lain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm
          changed={changed}
          fetcher={fetcher}
          // Form baru setelah berhasil, agar isian kata sandi tidak tertinggal.
          key={changed ? "changed" : "editing"}
        />
      </CardContent>
    </Card>
  );
};
