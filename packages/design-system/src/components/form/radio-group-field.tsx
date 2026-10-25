import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import {
  FormFieldDescription,
  FormFieldError,
  hasFieldErrors,
} from "@bermula/design-system/components/form/form-field";
import type { BaseFieldProps } from "@bermula/design-system/components/form/form-field";
import type { SelectOption } from "@bermula/design-system/components/form/select-field";
import {
  Field,
  FieldLabel,
  FieldLegend,
} from "@bermula/design-system/components/ui/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@bermula/design-system/components/ui/radio-group";

type RadioGroupFieldProps = BaseFieldProps & {
  options: SelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * Pilihan tunggal yang semua opsinya terlihat; cocok untuk 2–5 opsi.
 * Label menjadi `legend` grup, setiap opsi punya label sendiri.
 */
export const RadioGroupField = ({
  label,
  description,
  errors,
  className,
  name,
  disabled,
  options,
  onValueChange,
  ...radioGroupProps
}: RadioGroupFieldProps) => (
  <FieldPrimitive.Root
    className={className}
    disabled={disabled}
    invalid={hasFieldErrors(errors) || undefined}
    name={name}
    render={<Field />}
  >
    <FieldsetPrimitive.Root
      render={
        <RadioGroup
          {...radioGroupProps}
          onValueChange={(next) => {
            if (typeof next === "string") {
              onValueChange?.(next);
            }
          }}
        />
      }
    >
      <FieldsetPrimitive.Legend render={<FieldLegend variant="label" />}>
        {label}
      </FieldsetPrimitive.Legend>
      {options.map((option) => (
        <FieldPrimitive.Item disabled={option.disabled} key={option.value}>
          <FieldPrimitive.Label render={<FieldLabel className="font-normal" />}>
            <RadioGroupItem value={option.value} />
            {option.label}
          </FieldPrimitive.Label>
        </FieldPrimitive.Item>
      ))}
    </FieldsetPrimitive.Root>
    <FormFieldDescription>{description}</FormFieldDescription>
    <FormFieldError errors={errors} />
  </FieldPrimitive.Root>
);
