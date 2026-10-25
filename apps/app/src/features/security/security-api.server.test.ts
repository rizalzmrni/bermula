import { describe, expect, it } from "vitest";

import type { ApiBinding } from "../../lib/api-client";
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  getSecurityErrorMessage,
  readBackupCodes,
  readEnrollment,
  regenerateBackupCodes,
  verifyTwoFactorEnrollment,
} from "./security-api.server";

const APP_REQUEST = new Request("http://localhost:5173/settings/security", {
  headers: { cookie: "session=abc", origin: "http://localhost:5173" },
  method: "POST",
});

const TOTP_URI =
  "otpauth://totp/Bermula:budi%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Bermula";

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

const errorResponse = (status: number, code?: string) =>
  Response.json({ code, message: "error" }, { status });

describe("security api calls", () => {
  it.each([
    {
      body: { password: "rahasia-123" },
      call: (api: ApiBinding) =>
        enableTwoFactor({ api, password: "rahasia-123", request: APP_REQUEST }),
      path: "/api/auth/two-factor/enable",
    },
    {
      body: { code: "123456" },
      call: (api: ApiBinding) =>
        verifyTwoFactorEnrollment({
          api,
          code: "123456",
          request: APP_REQUEST,
        }),
      path: "/api/auth/two-factor/verify-totp",
    },
    {
      body: { password: "rahasia-123" },
      call: (api: ApiBinding) =>
        disableTwoFactor({
          api,
          password: "rahasia-123",
          request: APP_REQUEST,
        }),
      path: "/api/auth/two-factor/disable",
    },
    {
      body: { password: "rahasia-123" },
      call: (api: ApiBinding) =>
        regenerateBackupCodes({
          api,
          password: "rahasia-123",
          request: APP_REQUEST,
        }),
      path: "/api/auth/two-factor/generate-backup-codes",
    },
  ])("posts to $path with the session cookie", async ({ body, call, path }) => {
    const { api, requests } = createFakeApi();

    await call(api);

    const [sent] = requests;
    expect(sent?.method).toBe("POST");
    expect(new URL(sent?.url ?? "").pathname).toBe(path);
    expect(sent?.headers.get("cookie")).toBe("session=abc");
    expect(sent?.headers.get("origin")).toBe("http://localhost:5173");
    await expect(sent?.json()).resolves.toStrictEqual(body);
  });

  it("sends only the fields better-auth expects when changing the password", async () => {
    const { api, requests } = createFakeApi();

    await changePassword({
      api,
      input: {
        confirmPassword: "kata-sandi-baru",
        currentPassword: "kata-sandi-lama",
        intent: "change-password",
        newPassword: "kata-sandi-baru",
        revokeOtherSessions: true,
      },
      request: APP_REQUEST,
    });

    const [sent] = requests;
    expect(new URL(sent?.url ?? "").pathname).toBe("/api/auth/change-password");
    await expect(sent?.json()).resolves.toStrictEqual({
      currentPassword: "kata-sandi-lama",
      newPassword: "kata-sandi-baru",
      revokeOtherSessions: true,
    });
  });
});

describe(readEnrollment, () => {
  it("returns the URI, backup codes and the secret taken from the URI", async () => {
    const response = Response.json({
      backupCodes: ["aaaa-bbbb", "cccc-dddd"],
      totpURI: TOTP_URI,
    });

    await expect(readEnrollment(response)).resolves.toStrictEqual({
      backupCodes: ["aaaa-bbbb", "cccc-dddd"],
      secret: "JBSWY3DPEHPK3PXP",
      totpURI: TOTP_URI,
    });
  });

  it.each([
    { backupCodes: ["aaaa-bbbb"], totpURI: "https://evil.example.com" },
    { backupCodes: [], totpURI: TOTP_URI },
    {
      backupCodes: ["aaaa-bbbb"],
      totpURI: "otpauth://totp/Bermula:budi?issuer=Bermula",
    },
  ])("rejects an unexpected body %#", async (body) => {
    await expect(readEnrollment(Response.json(body))).resolves.toBeNull();
  });

  it("rejects a body that is not JSON", async () => {
    await expect(readEnrollment(new Response("oops"))).resolves.toBeNull();
  });
});

describe(readBackupCodes, () => {
  it("returns the new codes", async () => {
    const response = Response.json({
      backupCodes: ["aaaa-bbbb"],
      status: true,
    });
    await expect(readBackupCodes(response)).resolves.toStrictEqual([
      "aaaa-bbbb",
    ]);
  });

  it("rejects an empty list", async () => {
    await expect(
      readBackupCodes(Response.json({ backupCodes: [] }))
    ).resolves.toBeNull();
  });
});

describe(getSecurityErrorMessage, () => {
  it.each([
    { code: "INVALID_PASSWORD", expected: "Kata sandi salah.", status: 400 },
    { code: "INVALID_CODE", expected: "Kode salah.", status: 401 },
    { code: "PASSWORD_TOO_SHORT", expected: "minimal 8", status: 400 },
    { code: "PASSWORD_TOO_LONG", expected: "maksimal 128", status: 400 },
    {
      code: "CREDENTIAL_ACCOUNT_NOT_FOUND",
      expected: "belum punya kata sandi",
      status: 400,
    },
    { code: undefined, expected: "Terlalu banyak percobaan", status: 429 },
    { code: "SOMETHING_ELSE", expected: "Gagal menyimpan", status: 500 },
  ])("maps $code ($status)", async ({ code, expected, status }) => {
    await expect(
      getSecurityErrorMessage(errorResponse(status, code))
    ).resolves.toContain(expected);
  });
});
