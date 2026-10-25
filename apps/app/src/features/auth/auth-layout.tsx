import { Logo } from "@bermula/design-system/components/layout/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import type { ReactNode } from "react";

/** Tautan teks antar-halaman auth; garis bawah agar tidak hanya dibedakan warna. */
export const AUTH_LINK_CLASS =
  "text-foreground font-medium underline underline-offset-4 hover:no-underline";

interface AuthLayoutProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** Tautan ke halaman auth lain (mis. "Belum punya akun? Daftar"). */
  footer?: ReactNode;
}

/** Kerangka halaman publik auth (masuk, daftar, verifikasi email). */
export const AuthLayout = ({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) => (
  <main className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
    <Logo />
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <CardFooter className="text-muted-foreground justify-center text-sm">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  </main>
);
