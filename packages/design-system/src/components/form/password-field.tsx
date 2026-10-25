import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@bermula/design-system/components/ui/input-group";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useId, useState } from "react";
import type { ComponentProps } from "react";

type PasswordFieldProps = BaseFieldProps &
  Omit<ComponentProps<"input">, "children" | "className" | "type">;

/** Input kata sandi dengan tombol tampilkan/sembunyikan. */
export const PasswordField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  id,
  ...inputProps
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const ToggleIcon = visible ? IconEyeOff : IconEye;

  return (
    <FormField
      className={className}
      description={description}
      disabled={disabled}
      errors={errors}
      label={label}
      name={name}
    >
      <InputGroup>
        <InputGroupInput
          {...inputProps}
          id={inputId}
          type={visible ? "text" : "password"}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-controls={inputId}
            aria-pressed={visible}
            disabled={disabled}
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
