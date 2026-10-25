import { Field as FieldPrimitive } from "@base-ui/react/field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@bermula/design-system/components/ui/field";
import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * Bentuk error eksternal yang diterima semua field. Cocok dengan
 * `field.state.meta.errors` TanStack Form saat validatornya skema Zod.
 */
export type FieldErrors = ({ message?: string } | undefined)[];

/** Props bersama semua field. */
export interface BaseFieldProps {
  label: ReactNode;
  description?: ReactNode;
  /** Error dari luar (TanStack Form/server); menimpa pesan validasi browser. */
  errors?: FieldErrors;
  className?: string;
}

export const getErrorMessages = (errors: FieldErrors | undefined) => [
  ...new Set(
    (errors ?? [])
      .map((error) => error?.message)
      .filter((message): message is string => Boolean(message))
  ),
];

export const hasFieldErrors = (errors: FieldErrors | undefined) =>
  getErrorMessages(errors).length > 0;

const ERROR_CLASS = "text-sm font-normal text-destructive";

/** Deskripsi field; Base UI menautkannya ke kontrol lewat `aria-describedby`. */
export const FormFieldDescription = ({ children }: { children?: ReactNode }) =>
  children ? (
    <FieldPrimitive.Description render={<FieldDescription />}>
      {children}
    </FieldPrimitive.Description>
  ) : null;

/**
 * Pesan error: error eksternal bila ada, selain itu pesan validasi browser
 * (`validationMessage`, sudah dilokalkan browser) setelah form divalidasi.
 */
export const FormFieldError = ({ errors }: { errors?: FieldErrors }) => {
  const messages = getErrorMessages(errors);

  // Tanpa `children` sama sekali (bukan `undefined`), agar Base UI mengisi
  // pesan validasi browser.
  return messages.length > 0 ? (
    <FieldPrimitive.Error className={ERROR_CLASS} match role="alert">
      {messages.join(" ")}
    </FieldPrimitive.Error>
  ) : (
    <FieldPrimitive.Error className={ERROR_CLASS} role="alert" />
  );
};

interface FormFieldProps extends BaseFieldProps {
  /** Nama field; dipakai untuk `FormData` dan error server di `Form`. */
  name?: string;
  disabled?: boolean;
  /** `horizontal` untuk checkbox/switch (kontrol di samping label). */
  orientation?: "vertical" | "horizontal";
  /** Id label, bila kontrol perlu `aria-labelledby` sendiri (mis. date picker). */
  labelId?: string;
  children: ReactNode;
}

/**
 * Kerangka satu field di atas `Field` Base UI: label, deskripsi, dan error
 * ditautkan otomatis ke kontrol, dan atribut validasi browser (`required`,
 * `minLength`, `pattern`, `type`, dll.) pada kontrol divalidasi saat `Form`
 * di-submit.
 */
export const FormField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  orientation = "vertical",
  labelId,
  children,
}: FormFieldProps) => {
  const invalid = hasFieldErrors(errors);
  const labelElement = (
    <FieldPrimitive.Label id={labelId} render={<FieldLabel />}>
      {label}
    </FieldPrimitive.Label>
  );

  return (
    <FieldPrimitive.Root
      className={cn(className)}
      disabled={disabled}
      // `undefined` (bukan `false`) agar validitas browser tetap berlaku.
      invalid={invalid || undefined}
      name={name}
      render={<Field orientation={orientation} />}
    >
      {orientation === "horizontal" ? (
        <>
          {children}
          <FieldContent>
            {labelElement}
            <FormFieldDescription>{description}</FormFieldDescription>
            <FormFieldError errors={errors} />
          </FieldContent>
        </>
      ) : (
        <>
          {labelElement}
          {children}
          <FormFieldDescription>{description}</FormFieldDescription>
          <FormFieldError errors={errors} />
        </>
      )}
    </FieldPrimitive.Root>
  );
};
