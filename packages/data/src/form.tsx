import { CheckboxField } from "@bermula/design-system/components/form/checkbox-field";
import { ComboboxField } from "@bermula/design-system/components/form/combobox-field";
import { DatePickerField } from "@bermula/design-system/components/form/date-picker-field";
import { Form as FormRoot } from "@bermula/design-system/components/form/form";
import { OtpField } from "@bermula/design-system/components/form/otp-field";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { RadioGroupField } from "@bermula/design-system/components/form/radio-group-field";
import { SelectField } from "@bermula/design-system/components/form/select-field";
import { SubmitButton as SubmitButtonBase } from "@bermula/design-system/components/form/submit-button";
import { SwitchField } from "@bermula/design-system/components/form/switch-field";
import { TextField } from "@bermula/design-system/components/form/text-field";
import { TextareaField } from "@bermula/design-system/components/form/textarea-field";
import {
  createFormHook,
  createFormHookContexts,
  revalidateLogic,
} from "@tanstack/react-form";
import type { ComponentProps } from "react";

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

/**
 * Meta submit semua form: elemen `<form>` yang di-submit. Action React Router
 * menerima elemen itu sendiri (`useSubmit`/`fetcher.submit`), sehingga isi
 * request sama persis dengan submit tanpa JavaScript.
 */
export interface FormSubmitMeta {
  form: HTMLFormElement | null;
}

/** Nilai awal `onSubmitMeta` di `useAppForm`; diisi `Form` saat submit. */
export const FORM_SUBMIT_META: FormSubmitMeta = { form: null };

/**
 * Validasi ala React Hook Form: skema `onDynamic` dijalankan saat submit,
 * lalu ulang setiap perubahan setelah submit pertama.
 */
export const formValidationLogic = revalidateLogic();

/**
 * Opsi `useAppForm` untuk form yang dikirim sebagai elemen `<form>` (mis.
 * ke action React Router lewat `useSubmit` atau `fetcher.submit`). Tombol
 * submit tetap sibuk sampai Promise dari `submit` selesai.
 *
 * @example
 * const form = useAppForm({
 *   defaultValues: { email: "" },
 *   validators: { onDynamic: schema },
 *   ...formElementSubmit((element) => submit(element)),
 * });
 */
export const formElementSubmit = (
  submit: (form: HTMLFormElement) => Promise<unknown>
) => ({
  onSubmit: async ({ meta }: { meta: FormSubmitMeta }) => {
    if (meta.form) {
      await submit(meta.form);
    }
  },
  onSubmitMeta: FORM_SUBMIT_META,
  validationLogic: formValidationLogic,
});

// Props kontrol yang diisi dari field TanStack; sisanya tetap dari pemanggil.
type BoundProps<TProps> = Omit<
  TProps,
  "name" | "value" | "onChange" | "onBlur" | "errors"
>;

// Untuk field pilihan & tanggal yang nilainya lewat `onValueChange`.
type BoundValueProps<TProps> = Omit<
  BoundProps<TProps>,
  "defaultValue" | "onValueChange"
>;

const BoundTextField = (
  props: BoundProps<ComponentProps<typeof TextField>>
) => {
  const field = useFieldContext<string>();
  return (
    <TextField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      value={field.state.value}
    />
  );
};

const BoundPasswordField = (
  props: BoundProps<ComponentProps<typeof PasswordField>>
) => {
  const field = useFieldContext<string>();
  return (
    <PasswordField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      value={field.state.value}
    />
  );
};

const BoundTextareaField = (
  props: BoundProps<ComponentProps<typeof TextareaField>>
) => {
  const field = useFieldContext<string>();
  return (
    <TextareaField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      value={field.state.value}
    />
  );
};

const BoundOtpField = (
  props: BoundValueProps<ComponentProps<typeof OtpField>>
) => {
  const field = useFieldContext<string>();
  return (
    <OtpField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onValueChange={(value) => field.handleChange(value)}
      value={field.state.value}
    />
  );
};

const BoundCheckboxField = (
  props: Omit<
    BoundProps<ComponentProps<typeof CheckboxField>>,
    "checked" | "defaultChecked" | "onCheckedChange"
  >
) => {
  const field = useFieldContext<boolean>();
  return (
    <CheckboxField
      {...props}
      checked={field.state.value}
      errors={field.state.meta.errors}
      name={field.name}
      onCheckedChange={(checked) => field.handleChange(checked)}
    />
  );
};

const BoundSwitchField = (
  props: Omit<
    BoundProps<ComponentProps<typeof SwitchField>>,
    "checked" | "defaultChecked" | "onCheckedChange"
  >
) => {
  const field = useFieldContext<boolean>();
  return (
    <SwitchField
      {...props}
      checked={field.state.value}
      errors={field.state.meta.errors}
      name={field.name}
      onCheckedChange={(checked) => field.handleChange(checked)}
    />
  );
};

/** Nilai `string | null`: `null` = belum ada yang dipilih. */
const BoundSelectField = (
  props: BoundValueProps<ComponentProps<typeof SelectField>>
) => {
  const field = useFieldContext<string | null>();
  return (
    <SelectField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onValueChange={(value) => field.handleChange(value)}
      value={field.state.value}
    />
  );
};

/** Nilai `string | null` (`option.value`), sama seperti `SelectField`. */
const BoundComboboxField = (
  props: BoundValueProps<ComponentProps<typeof ComboboxField>>
) => {
  const field = useFieldContext<string | null>();
  return (
    <ComboboxField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onValueChange={(value) => field.handleChange(value)}
      value={field.state.value}
    />
  );
};

/** Nilai `string | null`; `null` hanya sebelum pengguna memilih. */
const BoundRadioGroupField = (
  props: BoundValueProps<ComponentProps<typeof RadioGroupField>>
) => {
  const field = useFieldContext<string | null>();
  return (
    <RadioGroupField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onValueChange={(value) => field.handleChange(value)}
      value={field.state.value}
    />
  );
};

/**
 * Nilai `Date | null` (tanggal lokal) di state form; elemen form tetap
 * mengirim `YYYY-MM-DD` ke action lewat input tersembunyi.
 */
const BoundDatePickerField = (
  props: BoundValueProps<ComponentProps<typeof DatePickerField>>
) => {
  const field = useFieldContext<Date | null>();
  return (
    <DatePickerField
      {...props}
      errors={field.state.meta.errors}
      name={field.name}
      onBlur={field.handleBlur}
      onValueChange={(value) => field.handleChange(value)}
      value={field.state.value}
    />
  );
};

/**
 * `<form>` design-system yang terhubung ke TanStack Form. Atribut validasi
 * browser diperiksa dulu oleh `Form` Base UI; bila lolos, skema Zod form
 * dijalankan, lalu `onSubmit` menerima elemen form lewat `meta.form`.
 */
const Form = (props: Omit<ComponentProps<typeof FormRoot>, "onSubmit">) => {
  const form = useFormContext();
  return (
    <FormRoot
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const meta: FormSubmitMeta = { form: event.currentTarget };
        // Error submit sudah tercermin di state form; tidak ada yang perlu
        // ditangani di sini.
        void form.handleSubmit(meta);
      }}
    />
  );
};

/** Tombol submit yang menampilkan spinner selama `onSubmit` berjalan. */
const SubmitButton = (
  props: Omit<ComponentProps<typeof SubmitButtonBase>, "pending">
) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <SubmitButtonBase {...props} pending={isSubmitting} />}
    </form.Subscribe>
  );
};

/**
 * Hook form aplikasi: field design-system sudah terikat ke state TanStack
 * Form (`form.AppField` + `field.TextField`, dll.), error validasi tampil di
 * bawah field, dan `form.Form`/`form.SubmitButton` dipakai di dalam
 * `form.AppForm`.
 */
export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField: BoundCheckboxField,
    ComboboxField: BoundComboboxField,
    DatePickerField: BoundDatePickerField,
    OtpField: BoundOtpField,
    PasswordField: BoundPasswordField,
    RadioGroupField: BoundRadioGroupField,
    SelectField: BoundSelectField,
    SwitchField: BoundSwitchField,
    TextField: BoundTextField,
    TextareaField: BoundTextareaField,
  },
  fieldContext,
  formComponents: { Form, SubmitButton },
  formContext,
});
