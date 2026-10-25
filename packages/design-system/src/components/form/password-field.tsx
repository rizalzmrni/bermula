import {
  FormField,
  hasFieldErrors,
  useFieldA11y,
} from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@bermula/design-system/components/ui/input-group";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import type { ComponentProps } from "react";

type PasswordFieldProps = BaseFieldProps &
  Omit<ComponentProps<"input">, "children" | "className" | "type">;

/** Input kata sandi dengan tombol tampilkan/sembunyikan. */
export const PasswordField = ({
  label,
  description,
  errors,
  className,
  id,
  ...inputProps
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
  const invalid = hasFieldErrors(errors);
  const { controlProps, ...ids } = useFieldA11y({
    hasDescription: Boolean(description),
    id,
    invalid,
  });
  const ToggleIcon = visible ? IconEyeOff : IconEye;

  return (
    <FormField
      className={className}
      description={description}
      errors={errors}
      invalid={invalid}
      label={label}
      {...ids}
    >
      <InputGroup>
        <InputGroupInput
          {...inputProps}
          {...controlProps}
          type={visible ? "text" : "password"}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-controls={ids.controlId}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            size="icon-xs"
          >
            <ToggleIcon />
            <span className="sr-only">
              {visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            </span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FormField>
  );
};
