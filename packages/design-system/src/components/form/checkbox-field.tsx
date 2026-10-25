import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Checkbox } from "@bermula/design-system/components/ui/checkbox";
import type { ComponentProps } from "react";

type CheckboxFieldProps = BaseFieldProps &
  Omit<ComponentProps<typeof Checkbox>, "className" | "children">;

/**
 * Checkbox dengan label di sampingnya (mis. "Saya setuju dengan syarat").
 * `required` membuat `Form` menolak submit selama belum dicentang.
 */
export const CheckboxField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  ...checkboxProps
}: CheckboxFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
    orientation="horizontal"
  >
    <Checkbox {...checkboxProps} />
  </FormField>
);
