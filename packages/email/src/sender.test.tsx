import { describe, expect, it, vi } from "vitest";

import { createEmailSender } from "./sender";
import type { EmailMessage, EmailTransport } from "./transport";

const FROM = "Bermula <noreply@example.com>";

const setup = () => {
  const sent: EmailMessage[] = [];
  const transport: EmailTransport = {
    send: (message) => {
      sent.push(message);
      return Promise.resolve();
    },
  };
  return { sender: createEmailSender({ from: FROM, transport }), sent };
};

describe(createEmailSender, () => {
  it("renders the verification email with html and plain text", async () => {
    const { sender, sent } = setup();
    const url = "http://localhost:8787/api/auth/verify-email?token=abc";

    await sender.sendVerificationEmail({
      name: "Budi",
      to: "budi@example.com",
      url,
    });

    const [message] = sent;
    expect(message).toMatchObject({
      from: FROM,
      subject: "Verifikasi email Anda di Bermula",
      to: "budi@example.com",
    });
    expect(message?.html).toContain('lang="id"');
    expect(message?.html).toContain(`href="${url}"`);
    expect(message?.text).toContain("Halo Budi");
    expect(message?.text).toContain(url);
  });

  it("renders the reset password email", async () => {
    const { sender, sent } = setup();

    await sender.sendResetPasswordEmail({
      name: "Budi",
      to: "budi@example.com",
      url: "http://localhost:8787/reset/abc",
    });

    expect(sent[0]?.subject).toBe("Atur ulang kata sandi Bermula Anda");
    expect(sent[0]?.text).toContain("http://localhost:8787/reset/abc");
  });

  it("puts the inviter and organization in the invitation subject", async () => {
    const { sender, sent } = setup();

    await sender.sendOrganizationInvitationEmail({
      inviterName: "Budi",
      organizationName: "Tim Pemasaran",
      to: "sari@example.com",
      url: "http://localhost:5173/accept-invitation/inv-1",
    });

    expect(sent[0]?.subject).toBe(
      "Budi mengundang Anda ke Tim Pemasaran di Bermula"
    );
    expect(sent[0]?.html).toContain("Tim Pemasaran");
  });

  it("escapes user-controlled names in the html", async () => {
    const { sender, sent } = setup();

    await sender.sendOrganizationInvitationEmail({
      inviterName: "<script>alert(1)</script>",
      organizationName: "Tim",
      to: "sari@example.com",
      url: "http://localhost:5173/accept-invitation/inv-1",
    });

    expect(sent[0]?.html).not.toContain("<script>");
  });

  it("propagates transport failures to the caller", async () => {
    const failure = new Error("Resend rejected email");
    const sender = createEmailSender({
      from: FROM,
      transport: {
        send: vi.fn<EmailTransport["send"]>(() => Promise.reject(failure)),
      },
    });

    await expect(
      sender.sendResetPasswordEmail({
        name: "Budi",
        to: "budi@example.com",
        url: "http://localhost:8787/reset/abc",
      })
    ).rejects.toBe(failure);
  });
});
