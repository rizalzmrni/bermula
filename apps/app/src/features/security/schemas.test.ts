import { describe, expect, it } from "vitest";

import {
  changePasswordFieldsSchema,
  SECURITY_INTENT,
  securityActionSchema,
} from "./schemas";

const CHANGE_PASSWORD = {
  confirmPassword: "kata-sandi-baru",
  currentPassword: "kata-sandi-lama",
  intent: SECURITY_INTENT.changePassword,
  newPassword: "kata-sandi-baru",
};

describe("security action schema", () => {
  it("turns the checkbox value into a boolean", () => {
    const checked = securityActionSchema.parse({
      ...CHANGE_PASSWORD,
      revokeOtherSessions: "on",
    });
    const unchecked = securityActionSchema.parse(CHANGE_PASSWORD);

    expect(checked).toMatchObject({ revokeOtherSessions: true });
    expect(unchecked).toMatchObject({ revokeOtherSessions: false });
  });

  it("reports a mismatched confirmation on confirmPassword", () => {
    const result = securityActionSchema.safeParse({
      ...CHANGE_PASSWORD,
      confirmPassword: "lain",
    });

    expect(result.success).toBeFalsy();
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        message: "Konfirmasi kata sandi tidak sama.",
        path: ["confirmPassword"],
      })
    );
  });

  it("rejects a new password shorter than the minimum", () => {
    const result = securityActionSchema.safeParse({
      ...CHANGE_PASSWORD,
      confirmPassword: "pendek",
      newPassword: "pendek",
    });
    expect(result.success).toBeFalsy();
  });

  it.each(["12345", "1234567", "abcdef"])(
    "rejects the verification code %s",
    (code) => {
      const result = securityActionSchema.safeParse({
        code,
        intent: SECURITY_INTENT.verifyTwoFactor,
      });
      expect(result.success).toBeFalsy();
    }
  );

  it.each([
    SECURITY_INTENT.enableTwoFactor,
    SECURITY_INTENT.disableTwoFactor,
    SECURITY_INTENT.regenerateBackupCodes,
  ])("requires the password for %s", (intent) => {
    expect(securityActionSchema.safeParse({ intent }).success).toBeFalsy();
    expect(
      securityActionSchema.safeParse({ intent, password: "rahasia" }).success
    ).toBeTruthy();
  });

  it("rejects an unknown intent", () => {
    expect(
      securityActionSchema.safeParse({ intent: "delete-account" }).success
    ).toBeFalsy();
  });
});

describe("change password form schema", () => {
  const FIELDS = {
    confirmPassword: "kata-sandi-baru",
    currentPassword: "kata-sandi-lama",
    newPassword: "kata-sandi-baru",
    revokeOtherSessions: true,
  };

  it("applies the same confirmation rule as the action, in Indonesian", () => {
    const result = changePasswordFieldsSchema.safeParse({
      ...FIELDS,
      confirmPassword: "lain",
    });

    expect(result.error?.issues).toStrictEqual([
      expect.objectContaining({
        message: "Konfirmasi kata sandi tidak sama.",
        path: ["confirmPassword"],
      }),
    ]);
  });

  it("rejects a short new password with the configured message", () => {
    const result = changePasswordFieldsSchema.safeParse({
      ...FIELDS,
      confirmPassword: "pendek",
      newPassword: "pendek",
    });

    expect(result.error?.issues[0]?.message).toBe(
      "Kata sandi minimal 8 karakter."
    );
  });
});
