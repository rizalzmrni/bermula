import { Form as FormPrimitive } from "@base-ui/react/form";
import { cn } from "cn";
import type { ComponentProps } from "react";

type FormProps = ComponentProps<typeof FormPrimitive>;

/**
 * Form di atas `Form` Base UI. Saat submit, atribut validasi browser setiap
 * field diperiksa dulu: pesan error tampil di bawah field, fokus pindah ke
 * field pertama yang tidak valid, dan `onSubmit` tidak dipanggil. Prop
 * `errors` (`{ [name]: pesan }`) menampilkan error dari server per field.
 */
export const Form = ({ className, ...props }: FormProps) => (
  <FormPrimitive className={cn("flex flex-col gap-6", className)} {...props} />
);
