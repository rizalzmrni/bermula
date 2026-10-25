import {
  FormField,
  hasFieldErrors,
  useFieldA11y,
} from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bermula/design-system/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectFieldProps = BaseFieldProps & {
  options: SelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Dipanggil saat popup ditutup; teruskan ke `field.handleBlur` TanStack Form. */
  onBlur?: () => void;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
};

/** Pilihan tunggal dari daftar `options` (Select Base UI). */
export const SelectField = ({
  label,
  description,
  errors,
  className,
  id,
  options,
  placeholder = "Pilih salah satu",
  onBlur,
  ...selectProps
}: SelectFieldProps) => {
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
      <Select
        {...selectProps}
        id={ids.controlId}
        items={options}
        onOpenChange={(open) => {
          if (!open) {
            onBlur?.();
          }
        }}
      >
        <SelectTrigger
          aria-describedby={controlProps["aria-describedby"]}
          aria-invalid={controlProps["aria-invalid"]}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};
