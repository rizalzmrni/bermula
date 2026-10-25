import { describe, expect, it } from "vitest";

import { getSetCookieHeaders } from "../../lib/api-client";
import { getSignInErrorMessage } from "./auth-api.server";

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
