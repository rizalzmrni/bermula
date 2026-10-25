import { Field as FieldPrimitive } from "@base-ui/react/field";
import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Textarea } from "@bermula/design-system/components/ui/textarea";
import type { ComponentProps } from "react";

type TextareaFieldProps = BaseFieldProps &
  Omit<ComponentProps<"textarea">, "children" | "className">;

export const TextareaField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  ...textareaProps
}: TextareaFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
  >
    {/* `Textarea` shadcn adalah elemen biasa; `Field.Control` mendaftarkannya ke Field. */}
    <FieldPrimitive.Control render={<Textarea {...textareaProps} />} />
  </FormField>
);
