import { CheckboxField } from "@bermula/design-system/components/form/checkbox-field";
import { Form } from "@bermula/design-system/components/form/form";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
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

import { FormErrorAlert } from "../auth/form-error-alert";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../auth/schemas";
import { isFormError } from "./action-result";
import type { SecurityActionResult } from "./action-result";
import { SECURITY_INTENT } from "./schemas";

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
        <Form
          // Form baru setelah berhasil, agar isian kata sandi tidak tertinggal.
          key={changed ? "changed" : "editing"}
          render={<fetcher.Form method="post" />}
        >
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
          <PasswordField
            autoComplete="current-password"
            label="Kata sandi saat ini"
            name="currentPassword"
            required
          />
          <PasswordField
            autoComplete="new-password"
            label="Kata sandi baru"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="newPassword"
            required
          />
          <PasswordField
            autoComplete="new-password"
            label="Ulangi kata sandi baru"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="confirmPassword"
            required
          />
          <CheckboxField
            defaultChecked
            description="Disarankan bila Anda curiga kata sandi lama diketahui orang lain."
            label="Keluarkan akun dari semua perangkat lain"
            name="revokeOtherSessions"
          />
          <SubmitButton
            className="w-full sm:w-fit"
            pending={fetcher.state === "submitting"}
            pendingLabel="Menyimpan…"
          >
            Ganti kata sandi
          </SubmitButton>
        </Form>
      </CardContent>
    </Card>
  );
};
