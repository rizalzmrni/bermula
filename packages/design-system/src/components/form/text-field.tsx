import {
  FormField,
  hasFieldErrors,
  useFieldA11y,
} from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Input } from "@bermula/design-system/components/ui/input";
import type { ComponentProps } from "react";

type TextFieldProps = BaseFieldProps &
  Omit<ComponentProps<"input">, "children" | "className">;

/** Input teks (email, URL, angka, dll. lewat `type`) dengan label dan error. */
export const TextField = ({
  label,
  description,
  errors,
  className,
  id,
  ...inputProps
}: TextFieldProps) => {
  const invalid = hasFieldErrors(errors);
  const { controlProps, ...ids } = useFieldA11y({
    hasDescription: Boolean(description),
    id,
    invalid,
  });

  return (
    <FormField
      className={className}
      description={description}
      errors={errors}
      invalid={invalid}
      label={label}
      {...ids}
    >
      <Input {...inputProps} {...controlProps} />
    </FormField>
  );
};
