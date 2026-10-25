import { describe, expect, it } from "vitest";

import { getSetCookieHeaders } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import {
  getSignInErrorMessage,
  getSignUpErrorMessage,
  getVerifyEmailCallbackUrl,
  getVerifyEmailErrorMessage,
  resendVerificationEmail,
  signUpWithEmail,
} from "./auth-api.server";
import { signUpSchema } from "./schemas";

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
