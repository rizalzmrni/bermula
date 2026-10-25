import { formElementSubmit, useAppForm } from "@bermula/data/form";
import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import { IconMailCheck } from "@tabler/icons-react";
import { useFetcher } from "react-router";

import { FormErrorAlert } from "./form-error-alert";
import { resendVerificationSchema } from "./schemas";

/** Hasil action `routes/verify-email.tsx`. */
export type ResendVerificationResult = { sent: true } | { formError: string };

/**
 * Kirim ulang tautan verifikasi lewat action `/verify-email`. Memakai fetcher
 * agar hasilnya tampil di tempat, baik dari halaman daftar maupun verifikasi.
 */
export const ResendVerificationForm = ({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) => {
  const fetcher = useFetcher<ResendVerificationResult>();
  const result = fetcher.data;
  const form = useAppForm({
    defaultValues: { email: defaultEmail },
    validators: { onDynamic: resendVerificationSchema },
    ...formElementSubmit((element) => fetcher.submit(element)),
  });

  return (
    <form.AppForm>
      <form.Form render={<fetcher.Form action="/verify-email" method="post" />}>
        {result && "sent" in result ? (
          <Alert>
            <IconMailCheck aria-hidden="true" />
            {/* Netral: api tidak membedakan email terdaftar/terverifikasi. */}
            <AlertDescription>
              Bila email ini terdaftar dan belum diverifikasi, tautan baru sudah
              dikirim.
            </AlertDescription>
          </Alert>
        ) : (
          <FormErrorAlert message={result?.formError} />
        )}
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
        <form.SubmitButton
          className="w-full"
          pendingLabel="Mengirim…"
          variant="outline"
        >
          Kirim ulang tautan verifikasi
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
