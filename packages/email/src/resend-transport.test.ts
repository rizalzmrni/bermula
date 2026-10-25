import { afterEach, describe, expect, it, vi } from "vitest";

import { createResendTransport } from "./resend-transport";
import type { EmailMessage } from "./transport";

const MESSAGE: EmailMessage = {
  from: "Bermula <noreply@example.com>",
  html: "<p>Halo</p>",
  subject: "Halo",
  text: "Halo",
  to: "budi@example.com",
};

// Tanpa jaringan: `fetch` diganti stub, sedangkan SDK Resend tetap asli
// sehingga cara SDK membaca respons sukses/gagal ikut teruji.
const stubFetch = (status: number, body: unknown) => {
  const fetchMock = vi.fn<typeof fetch>(() =>
    Promise.resolve(Response.json(body, { status }))
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe(createResendTransport, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the rendered message to the Resend emails endpoint", async () => {
    const fetchMock = stubFetch(200, { id: "email-1" });

    await createResendTransport({ apiKey: "re_test" }).send(MESSAGE);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.resend.com/emails");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      from: MESSAGE.from,
      html: MESSAGE.html,
      subject: MESSAGE.subject,
      text: MESSAGE.text,
      to: MESSAGE.to,
    });
  });

  it("throws when Resend rejects the email", async () => {
    stubFetch(403, {
      message: "The from address is not verified",
      name: "validation_error",
      statusCode: 403,
    });

    await expect(
      createResendTransport({ apiKey: "re_test" }).send(MESSAGE)
    ).rejects.toThrow(
      "Resend rejected email (validation_error, status 403): The from address is not verified"
    );
  });
});
