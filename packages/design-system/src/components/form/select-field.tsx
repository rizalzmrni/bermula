import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bermula/design-system/components/ui/select";

/** Satu pilihan untuk select, combobox, dan radio group. */
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
  name,
  disabled,
  options,
  placeholder = "Pilih salah satu",
  onBlur,
  ...selectProps
}: SelectFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
  >
    <Select
      {...selectProps}
      items={options}
      onOpenChange={(open) => {
        if (!open) {
          onBlur?.();
        }
      }}
    >
      <SelectTrigger className="w-full">
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
