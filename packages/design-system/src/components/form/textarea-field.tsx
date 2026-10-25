import {
  FormField,
  hasFieldErrors,
  useFieldA11y,
} from "@bermula/design-system/components/form/form-field";
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
  id,
  ...textareaProps
}: TextareaFieldProps) => {
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
      <Textarea {...textareaProps} {...controlProps} />
    </FormField>
  );
};
