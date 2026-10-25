import { OTPField } from "@base-ui/react/otp-field";
import { FormField } from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import type { ComponentProps } from "react";

type OtpFieldProps = BaseFieldProps &
  Pick<
    ComponentProps<typeof OTPField.Root>,
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "onValueComplete"
    | "validationType"
    | "mask"
    | "autoSubmit"
    | "required"
    | "disabled"
    | "id"
  > & {
    name?: string;
    /** Jumlah karakter kode. */
    length?: number;
    onBlur?: () => void;
  };

const DEFAULT_LENGTH = 6;

const SLOT_CLASS =
  "size-9 rounded-lg border border-input bg-transparent text-center text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

/**
 * Kode verifikasi satu karakter per kotak (OTP Field Base UI). Mendukung
 * tempel kode dan autofill SMS; `required` menolak kode yang belum lengkap.
 */
export const OtpField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  length = DEFAULT_LENGTH,
  onBlur,
  ...otpProps
}: OtpFieldProps) => (
  <FormField
    className={className}
    description={description}
    disabled={disabled}
    errors={errors}
    label={label}
    name={name}
  >
    <OTPField.Root
      {...otpProps}
      className="flex w-fit gap-2"
      length={length}
      onBlur={onBlur}
    >
      {Array.from({ length }, (_, index) => (
        <OTPField.Input
          aria-label={
            index === 0 ? undefined : `Karakter ${index + 1} dari ${length}`
          }
          className={SLOT_CLASS}
          // Slot OTP berurutan dan tidak pernah disusun ulang.
          // oxlint-disable-next-line react/no-array-index-key
          key={index}
        />
      ))}
    </OTPField.Root>
  </FormField>
);
