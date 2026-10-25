import { Button } from "@bermula/design-system/components/ui/button";
import { Spinner } from "@bermula/design-system/components/ui/spinner";
import type { ComponentProps } from "react";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & {
  /** Form sedang dikirim (mis. `form.state.isSubmitting`); tombol dinonaktifkan. */
  pending?: boolean;
  /** Teks saat `pending`; default tetap `children`. */
  pendingLabel?: string;
};

/** Tombol submit yang mencegah kirim ganda dan menampilkan spinner saat proses. */
export const SubmitButton = ({
  pending = false,
  pendingLabel,
  disabled,
  children,
  ...props
}: SubmitButtonProps) => (
  <Button
    {...props}
    aria-busy={pending || undefined}
    disabled={disabled || pending}
    type="submit"
  >
    {pending ? <Spinner aria-hidden="true" /> : null}
    {pending && pendingLabel ? pendingLabel : children}
  </Button>
);
