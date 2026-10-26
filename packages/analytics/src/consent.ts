import { data, redirect } from "react-router";
import { z } from "zod";

/** Cookie pilihan pengunjung; dibaca root loader agar SSR tahu perlu banner atau tidak. */
export const CONSENT_COOKIE_NAME = "analytics_consent";

export const CONSENT = {
  denied: "denied",
  granted: "granted",
} as const;

export type Consent = (typeof CONSENT)[keyof typeof CONSENT];

/** `reset` menghapus pilihan sehingga banner muncul lagi. */
export const CONSENT_CHOICE = { ...CONSENT, reset: "reset" } as const;

// Pilihan disimpan 6 bulan, lalu pengunjung ditanya ulang.
const CONSENT_MAX_AGE_SECONDS = 15_552_000;

const COOKIE_SEPARATOR = ";";

const consentSchema = z.enum([CONSENT.granted, CONSENT.denied]);

/** Pilihan dari header `Cookie`; `null` bila belum memilih (banner tampil). */
export const readConsent = (cookieHeader: string | null): Consent | null => {
  for (const part of (cookieHeader ?? "").split(COOKIE_SEPARATOR)) {
    const [name, value] = part.trim().split("=");
    if (name === CONSENT_COOKIE_NAME) {
      const parsed = consentSchema.safeParse(value);
      return parsed.success ? parsed.data : null;
    }
  }
  return null;
};

/** Header `Set-Cookie` untuk pilihan baru, atau penghapus cookie bila `null`. */
export const serializeConsentCookie = ({
  consent,
  secure,
}: {
  consent: Consent | null;
  secure: boolean;
}) =>
  [
    `${CONSENT_COOKIE_NAME}=${consent ?? ""}`,
    "Path=/",
    `Max-Age=${consent ? CONSENT_MAX_AGE_SECONDS : 0}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");

export const consentFormSchema = z.object({
  consent: z.enum([
    CONSENT_CHOICE.granted,
    CONSENT_CHOICE.denied,
    CONSENT_CHOICE.reset,
  ]),
  redirectTo: z.string().optional(),
});

const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;

/** Hanya path internal; menolak `//host` dan `/\host` (open redirect). */
const toSafePath = (target: string | undefined) =>
  target?.startsWith("/") &&
  !target.startsWith("//") &&
  !target.startsWith("/\\")
    ? target
    : "/";

/**
 * Action route `/consent`. Cookie disetel server (`Set-Cookie`), bukan
 * `document.cookie`. Submit form biasa (tanpa JavaScript, `Sec-Fetch-Mode:
 * navigate`) di-redirect kembali ke halaman asal; submit fetcher dibalas data
 * agar halaman tidak bernavigasi (posisi scroll tetap).
 */
export const handleConsentAction = async (request: Request) => {
  const url = new URL(request.url);
  // Form dari situs lain tidak boleh mengubah pilihan pengunjung.
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) {
    return data({ ok: false as const }, { status: HTTP_FORBIDDEN });
  }

  const parsed = consentFormSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return data({ ok: false as const }, { status: HTTP_BAD_REQUEST });
  }

  const { consent: choice, redirectTo } = parsed.data;
  const consent = choice === CONSENT_CHOICE.reset ? null : choice;
  const headers = {
    "Set-Cookie": serializeConsentCookie({
      consent,
      secure: url.protocol === "https:",
    }),
  };

  if (request.headers.get("sec-fetch-mode") === "navigate") {
    throw redirect(toSafePath(redirectTo), { headers });
  }
  return data({ consent, ok: true as const }, { headers });
};
