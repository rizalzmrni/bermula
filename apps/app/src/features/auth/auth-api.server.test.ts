import { describe, expect, it } from "vitest";

import { getSetCookieHeaders } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import {
  getResetPasswordError,
  getResetPasswordRedirectUrl,
  getSignInErrorMessage,
  getSignUpErrorMessage,
  getTwoFactorError,
  getVerifyEmailCallbackUrl,
  getVerifyEmailErrorMessage,
  hasTwoFactorChallenge,
  isTwoFactorRedirect,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  signUpWithEmail,
  verifyTwoFactor,
} from "./auth-api.server";
import {
  resetPasswordSchema,
  signUpSchema,
  TWO_FACTOR_METHOD,
  twoFactorFieldsSchemas,
  twoFactorSchema,
} from "./schemas";

const APP_REQUEST = new Request("http://localhost:5173/sign-up", {
  headers: { origin: "http://localhost:5173" },
  method: "POST",
});

/** Binding `API` palsu yang merekam request dan membalas `{ status: true }`. */
const createFakeApi = () => {
  const requests: Request[] = [];
  const api: ApiBinding = {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      return Promise.resolve(Response.json({ status: true }));
    },
  };
  return { api, requests };
};

describe(getVerifyEmailCallbackUrl, () => {
  it("points to the verify page on the app origin, not the api", () => {
    expect(getVerifyEmailCallbackUrl(APP_REQUEST)).toBe(
      "http://localhost:5173/verify-email"
    );
  });
});

describe(signUpWithEmail, () => {
  it("sends the input with an absolute callbackURL and the forwarded origin", async () => {
    const { api, requests } = createFakeApi();
    const input = {
      email: "budi@example.com",
      name: "Budi",
      password: "rahasia-123",
    };

    await signUpWithEmail({ api, input, request: APP_REQUEST });

    const [sent] = requests;
    expect(new URL(sent?.url ?? "").pathname).toBe("/api/auth/sign-up/email");
    expect(sent?.headers.get("origin")).toBe("http://localhost:5173");
    await expect(sent?.json()).resolves.toStrictEqual({
      ...input,
      callbackURL: "http://localhost:5173/verify-email",
    });
  });
});

describe(resendVerificationEmail, () => {
  it("asks the api to send a new link back to the app", async () => {
    const { api, requests } = createFakeApi();

    await resendVerificationEmail({
      api,
      email: "budi@example.com",
      request: APP_REQUEST,
    });

    const [sent] = requests;
    expect(new URL(sent?.url ?? "").pathname).toBe(
      "/api/auth/send-verification-email"
    );
    await expect(sent?.json()).resolves.toStrictEqual({
      callbackURL: "http://localhost:5173/verify-email",
      email: "budi@example.com",
    });
  });
});

describe("sign-up schema", () => {
  it("trims the name and accepts the minimum password length", () => {
    const parsed = signUpSchema.parse({
      email: "budi@example.com",
      name: "  Budi  ",
      password: "12345678",
    });
    expect(parsed.name).toBe("Budi");
  });

  it.each([
    { email: "budi@example.com", name: "   ", password: "12345678" },
    { email: "bukan-email", name: "Budi", password: "12345678" },
    { email: "budi@example.com", name: "Budi", password: "1234567" },
  ])("rejects %j", (input) => {
    expect(signUpSchema.safeParse(input).success).toBeFalsy();
  });
});

describe(getSignUpErrorMessage, () => {
  it("explains a password that is too short", async () => {
    const response = Response.json(
      { code: "PASSWORD_TOO_SHORT" },
      { status: 400 }
    );
    await expect(getSignUpErrorMessage(response)).resolves.toBe(
      "Kata sandi minimal 8 karakter."
    );
  });

  it("reports rate limiting", async () => {
    const response = new Response(null, { status: 429 });
    await expect(getSignUpErrorMessage(response)).resolves.toContain(
      "Terlalu banyak percobaan"
    );
  });

  it("falls back to a generic message", async () => {
    const response = new Response("<html>", { status: 500 });
    await expect(getSignUpErrorMessage(response)).resolves.toBe(
      "Gagal mendaftar. Silakan coba lagi."
    );
  });
});

describe(getVerifyEmailErrorMessage, () => {
  it("distinguishes an expired link from an invalid one", () => {
    expect(getVerifyEmailErrorMessage("TOKEN_EXPIRED")).toContain(
      "kedaluwarsa"
    );
    expect(getVerifyEmailErrorMessage("INVALID_TOKEN")).toContain(
      "tidak valid"
    );
  });
});

describe(getSignInErrorMessage, () => {
  it("explains wrong credentials", async () => {
    const response = Response.json(
      { code: "INVALID_EMAIL_OR_PASSWORD" },
      { status: 401 }
    );
    await expect(getSignInErrorMessage(response)).resolves.toBe(
      "Email atau kata sandi salah."
    );
  });

  it("asks to verify the email first", async () => {
    const response = Response.json(
      { code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
    await expect(getSignInErrorMessage(response)).resolves.toContain(
      "belum diverifikasi"
    );
  });

  it("reports rate limiting without reading the body", async () => {
    const response = new Response("not json", { status: 429 });
    await expect(getSignInErrorMessage(response)).resolves.toContain(
      "Terlalu banyak percobaan"
    );
  });

  it("falls back to a generic message for unexpected bodies", async () => {
    const response = new Response("<html>", { status: 500 });
    await expect(getSignInErrorMessage(response)).resolves.toBe(
      "Gagal masuk. Silakan coba lagi."
    );
  });
});

describe(getSetCookieHeaders, () => {
  it("keeps every Set-Cookie header from the API response", () => {
    const response = new Response(null, {
      headers: [
        ["set-cookie", "better-auth.session_token=abc; Path=/; HttpOnly"],
        ["set-cookie", "better-auth.session_data=xyz; Path=/; HttpOnly"],
      ],
    });
    expect(getSetCookieHeaders(response).getSetCookie()).toHaveLength(2);
  });
});

describe(isTwoFactorRedirect, () => {
  it("detects the 2FA challenge without consuming the body", async () => {
    const response = Response.json({
      twoFactorMethods: ["totp"],
      twoFactorRedirect: true,
    });
    await expect(isTwoFactorRedirect(response)).resolves.toBeTruthy();
    await expect(response.json()).resolves.toHaveProperty(
      "twoFactorRedirect",
      true
    );
  });

  it("is false for a normal sign-in or a non-JSON body", async () => {
    await expect(
      isTwoFactorRedirect(Response.json({ redirect: false, token: "abc" }))
    ).resolves.toBeFalsy();
    await expect(
      isTwoFactorRedirect(new Response("<html>"))
    ).resolves.toBeFalsy();
  });
});

describe(hasTwoFactorChallenge, () => {
  it.each([
    "better-auth.two_factor=abc",
    "theme=dark; better-auth.two_factor=abc",
    "__Secure-better-auth.two_factor=abc",
  ])("finds the challenge cookie in %j", (cookie) => {
    const request = new Request("http://localhost/", { headers: { cookie } });
    expect(hasTwoFactorChallenge(request)).toBeTruthy();
  });

  it("ignores requests without the cookie", () => {
    const request = new Request("http://localhost/", {
      headers: { cookie: "better-auth.session_token=abc; my_two_factor=x" },
    });
    expect(hasTwoFactorChallenge(request)).toBeFalsy();
    expect(hasTwoFactorChallenge(new Request("http://localhost/"))).toBeFalsy();
  });
});

describe(verifyTwoFactor, () => {
  it.each([
    ["totp", "123456", "/api/auth/two-factor/verify-totp"],
    ["backup-code", "abcde-12345", "/api/auth/two-factor/verify-backup-code"],
  ] as const)("sends a %s code to its endpoint", async (method, code, path) => {
    const { api, requests } = createFakeApi();

    await verifyTwoFactor({
      api,
      input: { code, method, trustDevice: true },
      request: APP_REQUEST,
    });

    const [sent] = requests;
    expect(new URL(sent?.url ?? "").pathname).toBe(path);
    await expect(sent?.json()).resolves.toStrictEqual({
      code,
      trustDevice: true,
    });
  });
});

describe("two-factor schema", () => {
  it("accepts a 6-digit TOTP code and reads the checkbox", () => {
    expect(
      twoFactorSchema.parse({
        code: "012345",
        method: "totp",
        trustDevice: "on",
      })
    ).toStrictEqual({ code: "012345", method: "totp", trustDevice: true });
  });

  it("treats a missing checkbox as not trusted", () => {
    expect(
      twoFactorSchema.parse({ code: "abcde-12345", method: "backup-code" })
        .trustDevice
    ).toBeFalsy();
  });

  it.each([
    { code: "12345", method: "totp" },
    { code: "12345a", method: "totp" },
    { code: "   ", method: "backup-code" },
    { code: "123456", method: "sms" },
  ])("rejects %j", (input) => {
    expect(twoFactorSchema.safeParse(input).success).toBeFalsy();
  });
});

describe(getTwoFactorError, () => {
  it("lets the user retry a wrong code", async () => {
    const response = Response.json({ code: "INVALID_CODE" }, { status: 401 });
    await expect(getTwoFactorError(response)).resolves.toStrictEqual({
      message: "Kode salah. Periksa lalu coba lagi.",
      restart: false,
    });
  });

  it.each([
    "INVALID_TWO_FACTOR_COOKIE",
    "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE",
    "ACCOUNT_TEMPORARILY_LOCKED",
  ])("asks to sign in again for %s", async (code) => {
    const response = Response.json({ code }, { status: 401 });
    await expect(getTwoFactorError(response)).resolves.toHaveProperty(
      "restart",
      true
    );
  });

  it("reports rate limiting without restarting", async () => {
    const response = new Response(null, { status: 429 });
    await expect(getTwoFactorError(response)).resolves.toStrictEqual({
      message: "Terlalu banyak percobaan. Coba lagi dalam satu menit.",
      restart: false,
    });
  });
});

describe(getResetPasswordRedirectUrl, () => {
  it("points to the reset page on the app origin, not the api", () => {
    expect(getResetPasswordRedirectUrl(APP_REQUEST)).toBe(
      "http://localhost:5173/reset-password"
    );
  });
});

describe(requestPasswordReset, () => {
  it("asks the api to email a link back to the app reset page", async () => {
    const { api, requests } = createFakeApi();

    await requestPasswordReset({
      api,
      input: { email: "budi@example.com" },
      request: APP_REQUEST,
    });

    const [sent] = requests;
    expect(new URL(sent?.url ?? "").pathname).toBe(
      "/api/auth/request-password-reset"
    );
    expect(sent?.headers.get("origin")).toBe("http://localhost:5173");
    await expect(sent?.json()).resolves.toStrictEqual({
      email: "budi@example.com",
      redirectTo: "http://localhost:5173/reset-password",
    });
  });
});

describe(resetPassword, () => {
  it("sends the token and the new password", async () => {
    const { api, requests } = createFakeApi();

    await resetPassword({
      api,
      input: { password: "rahasia-baru-123", token: "abc" },
      request: APP_REQUEST,
    });

    const [sent] = requests;
    expect(new URL(sent?.url ?? "").pathname).toBe("/api/auth/reset-password");
    await expect(sent?.json()).resolves.toStrictEqual({
      newPassword: "rahasia-baru-123",
      token: "abc",
    });
  });
});

describe("reset password schema", () => {
  it.each([
    { password: "1234567", token: "abc" },
    { password: "12345678", token: "" },
    { password: "12345678" },
  ])("rejects %j", (input) => {
    expect(resetPasswordSchema.safeParse(input).success).toBeFalsy();
  });
});

describe(getResetPasswordError, () => {
  it("asks for a new link when the token is invalid or used", async () => {
    const response = Response.json({ code: "INVALID_TOKEN" }, { status: 400 });
    await expect(getResetPasswordError(response)).resolves.toMatchObject({
      invalidLink: true,
    });
  });

  it("keeps the form for a password that is too short", async () => {
    const response = Response.json(
      { code: "PASSWORD_TOO_SHORT" },
      { status: 400 }
    );
    await expect(getResetPasswordError(response)).resolves.toStrictEqual({
      invalidLink: false,
      message: "Kata sandi minimal 8 karakter.",
    });
  });

  it("reports rate limiting", async () => {
    const response = new Response(null, { status: 429 });
    await expect(getResetPasswordError(response)).resolves.toMatchObject({
      invalidLink: false,
      message: expect.stringContaining("Terlalu banyak percobaan"),
    });
  });
});

describe("two-factor form schemas", () => {
  it("validates the TOTP code like the action, with the checkbox as boolean", () => {
    const schema = twoFactorFieldsSchemas[TWO_FACTOR_METHOD.totp];

    expect(
      schema.safeParse({ code: "123456", trustDevice: true }).success
    ).toBeTruthy();
    expect(
      schema.safeParse({ code: "12345", trustDevice: false }).error?.issues[0]
        ?.message
    ).toBe("Masukkan 6 digit kode.");
    expect(
      twoFactorSchema.safeParse({ code: "12345", method: "totp" }).success
    ).toBeFalsy();
  });
});
