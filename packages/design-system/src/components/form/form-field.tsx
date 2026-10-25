import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@bermula/design-system/components/ui/field";
import { useId } from "react";
import type { ReactNode } from "react";

/**
 * Bentuk error yang diterima semua field. Cocok dengan `field.state.meta.errors`
 * TanStack Form saat validator berupa skema Zod (issue punya `message`).
 */
export type FieldErrors = ({ message?: string } | undefined)[];

/** Props bersama semua field presentasional. */
export interface BaseFieldProps {
  label: ReactNode;
  description?: ReactNode;
  errors?: FieldErrors;
  className?: string;
}

export const hasFieldErrors = (errors: FieldErrors | undefined) =>
  errors?.some((error) => Boolean(error?.message)) ?? false;

interface FieldA11yOptions {
  id?: string;
  hasDescription: boolean;
  invalid: boolean;
}

/**
 * Id kontrol + atribut ARIA yang menautkan label, deskripsi, dan pesan error
 * ke kontrol, sehingga pembaca layar membacakan semuanya.
 */
export const useFieldA11y = ({
  id,
  hasDescription,
  invalid,
}: FieldA11yOptions) => {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const describedBy = [
    hasDescription ? descriptionId : null,
    invalid ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    controlId,
    controlProps: {
      "aria-describedby": describedBy || undefined,
      "aria-invalid": invalid || undefined,
      id: controlId,
    },
    descriptionId,
    errorId,
  };
};

interface FormFieldProps extends BaseFieldProps {
  controlId: string;
  descriptionId: string;
  errorId: string;
  invalid: boolean;
  /** `horizontal` untuk checkbox/switch (kontrol di samping label). */
  orientation?: "vertical" | "horizontal";
  children: ReactNode;
}

/** Kerangka label + kontrol + deskripsi + error yang dipakai semua field. */
export const FormField = ({
  label,
  description,
  errors,
  className,
  controlId,
  descriptionId,
  errorId,
  invalid,
  orientation = "vertical",
  children,
}: FormFieldProps) => {
  const labelElement = <FieldLabel htmlFor={controlId}>{label}</FieldLabel>;
  const descriptionElement = description ? (
    <FieldDescription id={descriptionId}>{description}</FieldDescription>
  ) : null;
  const errorElement = <FieldError errors={errors} id={errorId} />;

  if (orientation === "horizontal") {
    return (
      <Field
        className={className}
        data-invalid={invalid || undefined}
        orientation="horizontal"
      >
        {children}
        <FieldContent>
          {labelElement}
          {descriptionElement}
          {errorElement}
        </FieldContent>
      </Field>
    );
  }

  return (
    <Field className={className} data-invalid={invalid || undefined}>
      {labelElement}
      {children}
      {descriptionElement}
      {errorElement}
    </Field>
  );
};
