import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Input } from "@bermula/design-system/components/ui/input";
import type { ComponentProps } from "react";

type TextFieldProps = BaseFieldProps &
  Omit<ComponentProps<"input">, "children" | "className">;

/**
 * Input teks (email, URL, angka, dll. lewat `type`). Atribut validasi browser
 * (`required`, `minLength`, `pattern`, `min`/`max`) divalidasi oleh `Form`.
 */
export const TextField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  ...inputProps
}: TextFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
  >
    <Input {...inputProps} />
  </FormField>
);
