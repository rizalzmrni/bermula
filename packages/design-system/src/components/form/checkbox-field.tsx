import {
  FormField,
  hasFieldErrors,
  useFieldA11y,
} from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Checkbox } from "@bermula/design-system/components/ui/checkbox";
import type { ComponentProps } from "react";

type CheckboxFieldProps = BaseFieldProps &
  Omit<ComponentProps<typeof Checkbox>, "className" | "children">;

/** Checkbox dengan label di sampingnya (mis. "Saya setuju dengan syarat"). */
export const CheckboxField = ({
  label,
  description,
  errors,
  className,
  id,
  ...checkboxProps
}: CheckboxFieldProps) => {
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
      orientation="horizontal"
      {...ids}
    >
      <Checkbox {...checkboxProps} {...controlProps} />
    </FormField>
  );
};
