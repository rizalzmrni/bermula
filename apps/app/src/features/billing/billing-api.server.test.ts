import { describe, expect, it } from "vitest";

import { createApiClient } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import { openBillingPortal, startCheckout } from "./billing-api.server";

const ORGANIZATION_ID = "0b9c7c1e-7f5a-4c8e-9a51-2f3a4b5c6d7e";

const APP_REQUEST = new Request("http://localhost:5173/o/toko-budi/billing", {
  headers: { cookie: "session=abc", origin: "http://localhost:5173" },
  method: "POST",
});

/** Binding `API` palsu yang merekam request dan membalas `response`. */
const createClient = (response: Response) => {
  const requests: Request[] = [];
  const api: ApiBinding = {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      return Promise.resolve(response.clone());
    },
  };
  const client = createApiClient({ api, mode: "server", request: APP_REQUEST });
  return { client, requests };
};

const apiError = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

describe(startCheckout, () => {
  it("posts the plan with the session cookie and returns the Polar URL", async () => {
    const { client, requests } = createClient(
      Response.json(
        { url: "https://checkout.polar.test/co_1" },
        { status: 201 }
      )
    );

    const result = await startCheckout({
      client,
      organizationId: ORGANIZATION_ID,
      plan: "pro",
    });

    const [sent] = requests;
    expect(result).toStrictEqual({ url: "https://checkout.polar.test/co_1" });
    expect(new URL(sent?.url ?? "").pathname).toBe(
      `/api/organizations/${ORGANIZATION_ID}/billing/checkout-sessions`
    );
    expect(sent?.headers.get("cookie")).toBe("session=abc");
    await expect(sent?.json()).resolves.toStrictEqual({ plan: "pro" });
  });

  it("shows the api message when checkout is refused", async () => {
    const { client } = createClient(
      apiError(409, "ALREADY_SUBSCRIBED", "Organisasi sudah berlangganan.")
    );

    await expect(
      startCheckout({ client, organizationId: ORGANIZATION_ID, plan: "pro" })
    ).resolves.toStrictEqual({ formError: "Organisasi sudah berlangganan." });
  });
});

describe(openBillingPortal, () => {
  it("returns the portal URL", async () => {
    const { client, requests } = createClient(
      Response.json({ url: "https://portal.polar.test/s_1" }, { status: 201 })
    );

    await expect(
      openBillingPortal({ client, organizationId: ORGANIZATION_ID })
    ).resolves.toStrictEqual({
      url: "https://portal.polar.test/s_1",
    });
    expect(new URL(requests[0]?.url ?? "").pathname).toBe(
      `/api/organizations/${ORGANIZATION_ID}/billing/portal-sessions`
    );
  });

  it("falls back to a generic message for an unexpected body", async () => {
    const { client } = createClient(
      new Response("Bad gateway", { status: 502 })
    );

    const result = await openBillingPortal({
      client,
      organizationId: ORGANIZATION_ID,
    });

    expect(result).toStrictEqual({
      formError: "Gagal membuka halaman pembayaran. Silakan coba lagi.",
    });
  });
});
