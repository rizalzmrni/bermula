import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FORM_SUBMIT_META, formValidationLogic, useAppForm } from "./form";
import type { FormSubmitMeta } from "./form";

const signUpSchema = z
  .object({
    confirmPassword: z.string(),
    email: z.email("Format email tidak valid."),
    password: z.string().min(8, "Minimal 8 karakter."),
    terms: z.boolean(),
  })
  .refine((input) => input.confirmPassword === input.password, {
    message: "Konfirmasi tidak sama.",
    path: ["confirmPassword"],
  });

type OnSubmit = (args: {
  value: z.infer<typeof signUpSchema>;
  meta: FormSubmitMeta;
}) => Promise<void>;

const TestForm = ({ onSubmit }: { onSubmit: OnSubmit }) => {
  const form = useAppForm({
    defaultValues: {
      confirmPassword: "",
      email: "",
      password: "",
      terms: true,
    },
    onSubmit,
    onSubmitMeta: FORM_SUBMIT_META,
    validationLogic: formValidationLogic,
    validators: { onDynamic: signUpSchema },
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="email">
          {(field) => <field.TextField label="Email" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label="Kata sandi" />}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => <field.PasswordField label="Ulangi kata sandi" />}
        </form.AppField>
        <form.AppField name="terms">
          {(field) => <field.CheckboxField label="Saya setuju" />}
        </form.AppField>
        <form.SubmitButton>Kirim</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Kirim" }));

describe(useAppForm, () => {
  afterEach(cleanup);

  it("shows schema errors under the fields and does not submit", async () => {
    const onSubmit = vi.fn<OnSubmit>();
    render(<TestForm onSubmit={onSubmit} />);

    type("Email", "budi@example.com");
    type("Kata sandi", "rahasia-123");
    type("Ulangi kata sandi", "rahasia-321");
    submit();

    await expect(
      screen.findByText("Konfirmasi tidak sama.")
    ).resolves.toBeTruthy();
    expect(
      screen.getByLabelText("Ulangi kata sandi").getAttribute("aria-invalid")
    ).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("revalidates on change after the first submit", async () => {
    render(<TestForm onSubmit={vi.fn<OnSubmit>()} />);

    type("Email", "budi@example.com");
    type("Kata sandi", "rahasia-123");
    type("Ulangi kata sandi", "salah");
    submit();
    await screen.findByText("Konfirmasi tidak sama.");

    type("Ulangi kata sandi", "rahasia-123");

    await waitFor(() => {
      expect(screen.queryByText("Konfirmasi tidak sama.")).toBeNull();
    });
  });

  it("passes the values and the form element when valid", async () => {
    const onSubmit = vi.fn<OnSubmit>(() => Promise.resolve());
    render(<TestForm onSubmit={onSubmit} />);

    type("Email", "budi@example.com");
    type("Kata sandi", "rahasia-123");
    type("Ulangi kata sandi", "rahasia-123");
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
    const [args] = onSubmit.mock.calls[0] ?? [];
    expect(args?.value).toStrictEqual({
      confirmPassword: "rahasia-123",
      email: "budi@example.com",
      password: "rahasia-123",
      terms: true,
    });
    // Elemen form membawa nilai yang sama untuk submit native ke action.
    const formData = new FormData(args?.meta.form ?? undefined);
    expect(formData.get("email")).toBe("budi@example.com");
    expect(formData.get("terms")).toBe("on");
  });

  it("keeps the submit button busy while onSubmit runs", async () => {
    const pending = Promise.withResolvers<boolean>();
    const onSubmit = vi.fn<OnSubmit>(async () => {
      await pending.promise;
    });
    render(<TestForm onSubmit={onSubmit} />);

    type("Email", "budi@example.com");
    type("Kata sandi", "rahasia-123");
    type("Ulangi kata sandi", "rahasia-123");
    submit();

    const button = screen.getByRole("button", { name: "Kirim" });
    await waitFor(() => {
      expect(button.getAttribute("aria-busy")).toBe("true");
    });
    pending.resolve(true);
    await waitFor(() => {
      expect(button.getAttribute("aria-busy")).toBeNull();
    });
  });
});
