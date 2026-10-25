import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import type { SelectOption } from "@bermula/design-system/components/form/select-field";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@bermula/design-system/components/ui/combobox";

type ComboboxFieldProps = BaseFieldProps & {
  options: SelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Dipanggil saat popup ditutup; teruskan ke `field.handleBlur` TanStack Form. */
  onBlur?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

const findOption = (options: SelectOption[], value: string | null) =>
  options.find((option) => option.value === value) ?? null;

/**
 * Select yang bisa dicari; pakai untuk daftar panjang (negara, zona waktu).
 * Nilai yang dikirim ke form adalah `option.value`.
 */
export const ComboboxField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  options,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  placeholder = "Cari atau pilih",
  emptyMessage = "Tidak ada hasil.",
  required,
}: ComboboxFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
  >
    <Combobox
      defaultValue={
        defaultValue === undefined
          ? undefined
          : findOption(options, defaultValue)
      }
      items={options}
      onOpenChange={(open) => {
        if (!open) {
          onBlur?.();
        }
      }}
      onValueChange={(next: SelectOption | null) =>
        onValueChange?.(next?.value ?? null)
      }
      required={required}
      value={value === undefined ? undefined : findOption(options, value)}
    >
      <ComboboxInput className="w-full" placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(option: SelectOption) => (
            <ComboboxItem
              disabled={option.disabled}
              key={option.value}
              value={option}
            >
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  </FormField>
);
