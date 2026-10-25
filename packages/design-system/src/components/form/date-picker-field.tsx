import { Field as FieldPrimitive } from "@base-ui/react/field";
import { formatDate } from "@bermula/core/format";
import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import { Button } from "@bermula/design-system/components/ui/button";
import { Calendar } from "@bermula/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bermula/design-system/components/ui/popover";
import { IconCalendar } from "@tabler/icons-react";
import { useId, useRef, useState } from "react";
import type { Matcher } from "react-day-picker";
import { id as localeId } from "react-day-picker/locale";

type DatePickerFieldProps = BaseFieldProps & {
  /** Tanggal kalender lokal (jam diabaikan). */
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
  onBlur?: () => void;
  /** Tanggal paling awal/akhir yang bisa dipilih. */
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

const ISO_DATE_PAD = 2;
const pad = (value: number) => String(value).padStart(ISO_DATE_PAD, "0");

/** `YYYY-MM-DD` dari komponen tanggal lokal, tanpa geseran zona waktu. */
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Tanggal kalender diformat sebagai UTC agar hasil server dan browser sama,
// apa pun zona waktu masing-masing.
const formatCalendarDate = (date: Date) =>
  formatDate(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()), {
    dateStyle: "medium",
    timeZone: "UTC",
  });

const toDisabledMatchers = (minDate?: Date, maxDate?: Date): Matcher[] => [
  ...(minDate ? [{ before: minDate }] : []),
  ...(maxDate ? [{ after: maxDate }] : []),
];

/**
 * Pemilih tanggal (Popover + Calendar). Nilai dikirim ke `FormData` sebagai
 * `YYYY-MM-DD` lewat input tersembunyi, sehingga `required` divalidasi
 * browser seperti field lain.
 */
export const DatePickerField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  value,
  defaultValue = null,
  onValueChange,
  onBlur,
  minDate,
  maxDate,
  placeholder = "Pilih tanggal",
  required,
}: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const [uncontrolledDate, setUncontrolledDate] = useState(defaultValue);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const triggerId = useId();
  const date = value === undefined ? uncontrolledDate : value;

  // Calendar mengirim `undefined` saat tanggal terpilih diklik ulang (batal pilih).
  const selectDate = (next: Date | undefined) => {
    setUncontrolledDate(next ?? null);
    onValueChange?.(next ?? null);
    setOpen(false);
  };

  return (
    <FormField
      className={className}
      description={description}
      disabled={disabled}
      errors={errors}
      label={label}
      labelId={labelId}
      name={name}
    >
      {/* Pembawa nilai & validasi browser; fokus diteruskan ke tombol. */}
      <FieldPrimitive.Control
        className="sr-only"
        onFocus={() => triggerRef.current?.focus()}
        required={required}
        tabIndex={-1}
        value={date ? toIsoDate(date) : ""}
      />
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            onBlur?.();
          }
        }}
        open={open}
      >
        <PopoverTrigger
          render={
            <Button
              aria-labelledby={`${labelId} ${triggerId}`}
              className="group-data-invalid/field:border-destructive group-data-invalid/field:ring-destructive/20 data-placeholder:text-muted-foreground w-full justify-start font-normal group-data-invalid/field:ring-3"
              data-placeholder={date ? undefined : ""}
              disabled={disabled}
              id={triggerId}
              ref={triggerRef}
              variant="outline"
            />
          }
        >
          <IconCalendar data-icon="inline-start" />
          {date ? formatCalendarDate(date) : placeholder}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            autoFocus
            defaultMonth={date ?? undefined}
            disabled={toDisabledMatchers(minDate, maxDate)}
            endMonth={maxDate}
            locale={localeId}
            mode="single"
            onSelect={selectDate}
            selected={date ?? undefined}
            startMonth={minDate}
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
};
