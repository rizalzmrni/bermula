import { createQueryClient } from "@bermula/data/query-client";
import { describe, expect, it, vi } from "vitest";

import { accountKeys } from "../features/account/query-keys";
import { createApiClient } from "./api-client";
import type { ApiBinding } from "./api-client";
import { loadAccount } from "./session.server";

const ACCOUNT = {
  organization: {
    id: "0b9c7c1e-7f5a-4c8e-9a51-2f3a4b5c6d7e",
    isPersonal: true,
    logo: null,
    name: "Budi",
    role: "owner",
    slug: "personal-budi",
  },
  user: {
    email: "budi@example.com",
    id: "5f1d2c3b-4a59-4e6f-8a7b-9c0d1e2f3a4b",
    image: null,
    name: "Budi",
    role: "user",
    twoFactorEnabled: false,
  },
};

const createApi = (response: Response) => {
  const fetch = vi.fn<ApiBinding["fetch"]>().mockResolvedValue(response);
  return { api: { fetch }, fetch };
};

const request = new Request("http://localhost/proyek", {
  headers: {
    "cf-connecting-ip": "203.0.113.7",
    cookie: "better-auth.session_token=abc",
    "x-unrelated": "dropped",
  },
});

const load = (api: ApiBinding, queryClient = createQueryClient()) =>
  loadAccount({
    client: createApiClient({ api, mode: "server", request }),
    queryClient,
  });

describe(loadAccount, () => {
  it("returns the account and forwards the session cookie and client IP", async () => {
    const { api, fetch } = createApi(Response.json(ACCOUNT));

    await expect(load(api)).resolves.toStrictEqual(ACCOUNT);

    const [input, init] = fetch.mock.calls[0] ?? [];
    expect(String(input)).toMatch(/\/api\/me$/u);
    const headers = new Headers(init?.headers);
    expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
    expect(headers.get("cf-connecting-ip")).toBe("203.0.113.7");
    expect(headers.get("x-unrelated")).toBeNull();
  });

  it("caches the account for dehydrate and reuses it within the request", async () => {
    const { api, fetch } = createApi(Response.json(ACCOUNT));
    const queryClient = createQueryClient();

    await load(api, queryClient);
    await load(api, queryClient);

    expect(fetch).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(accountKeys.current())).toStrictEqual(
      ACCOUNT
    );
  });

  it("returns null when the user is not signed in", async () => {
    const { api } = createApi(Response.json({ error: {} }, { status: 401 }));
    await expect(load(api)).resolves.toBeNull();
  });

  it("throws other API failures to the error boundary", async () => {
    const { api } = createApi(Response.json({ error: {} }, { status: 403 }));
    await expect(load(api)).rejects.toMatchObject({
      init: { status: 403 },
    });
  });
});
