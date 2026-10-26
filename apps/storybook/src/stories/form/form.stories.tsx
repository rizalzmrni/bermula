import { Form } from "@bermula/design-system/components/form/form";
import { PasswordField } from "@bermula/design-system/components/form/password-field";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { TextField } from "@bermula/design-system/components/form/text-field";
import type { Meta, StoryObj } from "@storybook/react-vite";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Contoh komposisi: `Form` menjalankan validasi browser (`required`,
 * `type="email"`, `minLength`) saat submit dan menampilkan pesannya inline.
 * Di app, form ini dihubungkan ke TanStack Form lewat `@bermula/data/form`.
 */
const SignInForm = ({ pending = false }: { pending?: boolean }) => (
  <Form
    className="w-80"
    onSubmit={(event) => {
      // Story tidak punya action; cegah navigasi dokumen.
      event.preventDefault();
    }}
  >
    <TextField
      autoComplete="email"
      label="Email"
      name="email"
      required
      type="email"
    />
    <PasswordField
      autoComplete="current-password"
      label="Kata sandi"
      minLength={MIN_PASSWORD_LENGTH}
      name="password"
      required
    />
    <SubmitButton className="w-full" pending={pending}>
      Masuk
    </SubmitButton>
  </Form>
);

const meta = {
  args: { pending: false },
  component: SignInForm,
  title: "Form/Form",
} satisfies Meta<typeof SignInForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignIn: Story = {};

export const Pending: Story = {
  args: { pending: true },
};
