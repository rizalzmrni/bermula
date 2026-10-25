import { FormField } from "@bermula/design-system/components/form/form-field";
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
  name,
  disabled,
  ...switchProps
}: SwitchFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
    orientation="horizontal"
  >
    <Switch {...switchProps} />
  </FormField>
);
