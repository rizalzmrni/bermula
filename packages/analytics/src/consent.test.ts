// @vitest-environment node
// Kode server (action): `Request` happy-dom membuang header terlarang seperti
// `origin` dan `sec-fetch-mode`, jadi file ini memakai Request asli Node.

import { describe, expect, it } from "vitest";

import {
  CONSENT,
  handleConsentAction,
  readConsent,
  serializeConsentCookie,
} from "./consent";

const ORIGIN = "http://localhost:5174";

const submit = (
  fields: Record<string, string>,
  headers?: Record<string, string>
) =>
  new Request(`${ORIGIN}/consent`, {
    body: new URLSearchParams(fields),
    headers: headers ?? { origin: ORIGIN },
    method: "POST",
  });

/** Submit form biasa (tanpa JavaScript); action melempar redirect `Response`. */
const submitAsNavigation = async (redirectTo: string) => {
  try {
    await handleConsentAction(
      submit(
        { consent: "denied", redirectTo },
        { origin: ORIGIN, "sec-fetch-mode": "navigate" }
      )
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
  throw new Error("Expected a redirect");
};

/** `data()` React Router: objek dengan `init` (status, header). */
const readInit = (result: unknown) => {
  if (
    typeof result === "object" &&
    result !== null &&
    "init" in result &&
    "data" in result
  ) {
    const init = result.init as ResponseInit | null;
    return {
      body: result.data,
      headers: new Headers(init?.headers),
      status: init?.status ?? 200,
    };
  }
  throw new Error("Expected a data() result");
};

describe(readConsent, () => {
  it("reads a stored choice among other cookies", () => {
    expect(readConsent("a=1; analytics_consent=granted; b=2")).toBe(
      CONSENT.granted
    );
    expect(readConsent("analytics_consent=denied")).toBe(CONSENT.denied);
  });

  it("treats a missing or tampered cookie as no choice yet", () => {
    expect(readConsent(null)).toBeNull();
    expect(readConsent("analytics_consent=yes")).toBeNull();
  });
});

describe(serializeConsentCookie, () => {
  it("stores the choice for six months, Secure only over HTTPS", () => {
    expect(
      serializeConsentCookie({ consent: CONSENT.granted, secure: true })
    ).toBe(
      "analytics_consent=granted; Path=/; Max-Age=15552000; SameSite=Lax; Secure"
    );
    expect(
      serializeConsentCookie({ consent: CONSENT.denied, secure: false })
    ).not.toContain("Secure");
  });

  it("expires the cookie when the choice is reset", () => {
    expect(serializeConsentCookie({ consent: null, secure: false })).toContain(
      "Max-Age=0"
    );
  });
});

describe(handleConsentAction, () => {
  it("sets the cookie and answers a fetcher submit with data", async () => {
    const result = readInit(
      await handleConsentAction(submit({ consent: "granted" }))
    );

    expect(result.body).toStrictEqual({ consent: "granted", ok: true });
    expect(result.headers.get("set-cookie")).toContain(
      "analytics_consent=granted"
    );
  });

  it("redirects a plain form submit back to a safe internal path", async () => {
    const back = await submitAsNavigation("/harga?x=1");
    const external = await submitAsNavigation("//evil.example");

    expect(back.headers.get("location")).toBe("/harga?x=1");
    expect(back.headers.get("set-cookie")).toContain(
      "analytics_consent=denied"
    );
    expect(external.headers.get("location")).toBe("/");
  });

  it("clears the choice on reset", async () => {
    const result = readInit(
      await handleConsentAction(submit({ consent: "reset" }))
    );

    expect(result.body).toStrictEqual({ consent: null, ok: true });
    expect(result.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("rejects other origins and unknown choices", async () => {
    const crossSite = readInit(
      await handleConsentAction(
        submit({ consent: "granted" }, { origin: "https://evil.example" })
      )
    );
    const invalid = readInit(
      await handleConsentAction(submit({ consent: "maybe" }))
    );

    expect(crossSite.status).toBe(403);
    expect(crossSite.headers.has("set-cookie")).toBeFalsy();
    expect(invalid.status).toBe(400);
  });
});
