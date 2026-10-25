import { Form } from "@bermula/design-system/components/form/form";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { TextField } from "@bermula/design-system/components/form/text-field";
import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import { IconMailCheck } from "@tabler/icons-react";
import { useFetcher } from "react-router";

import { FormErrorAlert } from "./form-error-alert";

/** Hasil action `routes/verify-email.tsx`. */
export type ResendVerificationResult = { sent: true } | { formError: string };

/**
 * Kirim ulang tautan verifikasi lewat action `/verify-email`. Memakai fetcher
 * agar hasilnya tampil di tempat, baik dari halaman daftar maupun verifikasi.
 */
export const ResendVerificationForm = ({
  defaultEmail,
}: {
  defaultEmail?: string;
}) => {
  const fetcher = useFetcher<ResendVerificationResult>();
  const result = fetcher.data;

  return (
    <Form render={<fetcher.Form action="/verify-email" method="post" />}>
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
        pending={fetcher.state === "submitting"}
        pendingLabel="Mengirim…"
        variant="outline"
      >
        Kirim ulang tautan verifikasi
      </SubmitButton>
    </Form>
  );
};
