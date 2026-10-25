import {
  FormField,
  hasFieldErrors,
  useFieldA11y,
} from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Switch } from "@bermula/design-system/components/ui/switch";
import type { ComponentProps } from "react";

type SwitchFieldProps = BaseFieldProps &
  Omit<ComponentProps<typeof Switch>, "className" | "children">;

/** Saklar on/off untuk preferensi yang langsung berlaku (mis. notifikasi). */
export const SwitchField = ({
  label,
  description,
  errors,
  className,
  id,
  ...switchProps
}: SwitchFieldProps) => {
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
      <Switch {...switchProps} {...controlProps} />
    </FormField>
  );
};
