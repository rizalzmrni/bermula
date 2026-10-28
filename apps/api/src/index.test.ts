import { signWebhookPayload } from "@bermula/payments/testing";
import { env, exports } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";

import type { ErrorBody } from "./lib/errors";

const APP_ORIGIN = "http://localhost:5173";

// Setiap test memakai IP sendiri agar kuota rate limit tidak saling memengaruhi.
const request = (path: string, init: RequestInit & { ip: string }) => {
  const { ip, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("cf-connecting-ip", ip);
  return exports.default.fetch(`http://localhost:8787${path}`, {
    ...rest,
    headers,
  });
};

const preflight = (origin: string) =>
  request("/api/me", {
    headers: {
      "Access-Control-Request-Method": "GET",
      Origin: origin,
    },
    ip: "10.0.0.4",
    method: "OPTIONS",
  });

// Request pertama memicu transformasi Vite untuk modul besar (better-auth,
// React Email) di workerd; dipisah agar timeout tiap test tetap ketat.
const WARM_UP_TIMEOUT_MS = 60_000;

describe("api worker", () => {
  beforeAll(async () => {
    await request("/health", { ip: "10.0.0.0" });
  }, WARM_UP_TIMEOUT_MS);

  it("runs with the test bindings, not local secrets", () => {
    expect(env.DATABASE_URL).toBe("postgresql://test:test@db.invalid/test");
    // Opsional: kosong walau diisi di `.dev.vars` lokal.
    for (const value of [
      env.POSTHOG_PROJECT_TOKEN,
      env.BETTER_STACK_SOURCE_TOKEN,
      env.GOOGLE_CLIENT_ID,
    ]) {
      expect([undefined, ""]).toContain(value);
    }
  });

  it("answers the health check", async () => {
    const response = await request("/health", { ip: "10.0.0.1" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({ status: "ok" });
  });

  it("returns the uniform error shape for unknown routes", async () => {
    const response = await request("/nope", { ip: "10.0.0.2" });
    const body: ErrorBody = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("rejects /api/me without a session", async () => {
    const response = await request("/api/me", { ip: "10.0.0.3" });
    const body: ErrorBody = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("allows CORS with credentials only for configured origins", async () => {
    const allowed = await preflight(APP_ORIGIN);
    const blocked = await preflight("https://evil.example");

    expect(allowed.headers.get("access-control-allow-origin")).toBe(APP_ORIGIN);
    expect(allowed.headers.get("access-control-allow-credentials")).toBe(
      "true"
    );
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("serves the OpenAPI document with the session security scheme", async () => {
    const response = await request("/openapi.json", { ip: "10.0.0.5" });
    const document: {
      paths: Record<string, { get?: { security?: unknown } }>;
    } = await response.json();

    expect(response.status).toBe(200);
    expect(document.paths["/api/me"]?.get?.security).toStrictEqual([
      { sessionCookie: [] },
    ]);
  });

  it("documents better-auth endpoints next to the api routes", async () => {
    const response = await request("/openapi.json", { ip: "10.0.0.9" });
    const document: {
      components: { schemas: Record<string, unknown> };
      paths: Record<string, { post?: { tags?: string[] } }>;
    } = await response.json();

    expect(document.paths["/api/auth/sign-in/email"]?.post?.tags).toStrictEqual(
      ["Auth"]
    );
    expect(Object.keys(document.paths)).toStrictEqual(
      expect.arrayContaining([
        "/api/auth/organization/create",
        "/api/auth/two-factor/enable",
      ])
    );
    expect(Object.keys(document.components.schemas)).toStrictEqual(
      expect.arrayContaining(["Account", "AuthAccount", "AuthUser"])
    );
  });

  it("does not serve the better-auth reference page", async () => {
    const response = await request("/api/auth/reference", { ip: "10.0.0.10" });

    expect(response.status).toBe(404);
  });

  it("documents image and document routes separately", async () => {
    const response = await request("/openapi.json", { ip: "10.0.0.7" });
    const document: { paths: Record<string, unknown> } = await response.json();

    expect(Object.keys(document.paths)).toStrictEqual(
      expect.arrayContaining([
        "/api/images",
        "/api/images/{id}/complete",
        "/api/images/{id}/download",
        "/api/images/{id}",
        "/api/documents",
        "/api/documents/{id}/complete",
        "/api/documents/{id}/download",
        "/api/documents/{id}",
      ])
    );
  });

  it("requires a session for file uploads", async () => {
    const statuses = await Promise.all(
      ["/api/images", "/api/documents"].map(async (path) => {
        const response = await request(path, {
          body: JSON.stringify({
            contentType: "image/png",
            fileName: "a.png",
            size: 10,
          }),
          headers: { "content-type": "application/json" },
          ip: "10.0.0.8",
          method: "POST",
        });
        return response.status;
      })
    );

    expect(statuses).toStrictEqual([401, 401]);
  });

  it("rate limits /api/auth/* per IP", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      // Berurutan: binding Rate Limiting menghitung per request.
      // oxlint-disable-next-line no-await-in-loop
      const response = await request("/api/auth/ok", { ip: "10.0.0.6" });
      statuses.push(response.status);
    }

    expect(
      statuses.slice(0, 10).every((status) => status === 200)
    ).toBeTruthy();
    expect(statuses[10]).toBe(429);
  });

  it("limits organization auth endpoints with the API limit only", async () => {
    const statuses: number[] = [];
    // Satu lebih banyak dari batas AUTH_RATE_LIMIT (10/menit).
    for (let attempt = 0; attempt < 11; attempt += 1) {
      // oxlint-disable-next-line no-await-in-loop
      const response = await request("/api/auth/organization/list", {
        ip: "10.0.0.17",
      });
      statuses.push(response.status);
    }

    expect(statuses).not.toContain(429);
  });

  it("requires a session for billing endpoints", async () => {
    const responses = await Promise.all([
      request("/api/billing/subscription", { ip: "10.0.0.11" }),
      request("/api/billing/checkout-sessions", {
        body: JSON.stringify({ plan: "pro" }),
        headers: { "content-type": "application/json" },
        ip: "10.0.0.11",
        method: "POST",
      }),
      request("/api/billing/portal-sessions", {
        ip: "10.0.0.11",
        method: "POST",
      }),
    ]);

    expect(responses.map((response) => response.status)).toStrictEqual([
      401, 401, 401,
    ]);
  });

  it("rejects a Polar webhook with a forged or missing signature", async () => {
    const payload = JSON.stringify({ data: {}, type: "subscription.updated" });
    const forged = await request("/api/webhooks/polar", {
      body: payload,
      headers: await signWebhookPayload({
        payload,
        secret: "polar_whs_attacker_secret",
      }),
      ip: "10.0.0.12",
      method: "POST",
    });
    const missing = await request("/api/webhooks/polar", {
      body: payload,
      ip: "10.0.0.12",
      method: "POST",
    });
    const forgedBody: ErrorBody = await forged.json();

    expect(forged.status).toBe(403);
    expect(forgedBody.error.code).toBe("INVALID_SIGNATURE");
    expect(missing.status).toBe(400);
  });

  it("acknowledges a signed Polar event of an unknown type", async () => {
    // Dibalas tanpa menyentuh DB, jadi aman walau DB test tidak tersambung.
    const payload = JSON.stringify({ data: {}, type: "future.event" });
    const response = await request("/api/webhooks/polar", {
      body: payload,
      headers: await signWebhookPayload({ payload }),
      ip: "10.0.0.12",
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({ received: true });
  });

  it("does not rate limit Polar webhooks per IP", async () => {
    const statuses: number[] = [];
    // Satu lebih banyak dari batas API_RATE_LIMIT (100/menit).
    for (let attempt = 0; attempt < 101; attempt += 1) {
      // oxlint-disable-next-line no-await-in-loop
      const response = await request("/api/webhooks/polar", {
        body: "{}",
        headers: {
          "webhook-id": "msg_1",
          "webhook-signature": "v1,invalid",
          "webhook-timestamp": "1",
        },
        ip: "10.0.0.13",
        method: "POST",
      });
      statuses.push(response.status);
    }

    expect(statuses).not.toContain(429);
  });

  it("documents the billing and webhook routes", async () => {
    const response = await request("/openapi.json", { ip: "10.0.0.14" });
    const document: {
      paths: Record<string, { post?: { security?: unknown } }>;
    } = await response.json();

    expect(Object.keys(document.paths)).toStrictEqual(
      expect.arrayContaining([
        "/api/billing/subscription",
        "/api/billing/checkout-sessions",
        "/api/billing/portal-sessions",
        "/api/webhooks/polar",
      ])
    );
    expect(
      document.paths["/api/webhooks/polar"]?.post?.security
    ).toBeUndefined();
  });

  it("requires a session for organization endpoints", async () => {
    const organizationId = crypto.randomUUID();
    const responses = await Promise.all(
      [
        "/api/me/organizations",
        "/api/me/invitations",
        `/api/organizations/${organizationId}/members`,
        `/api/organizations/${organizationId}/invitations`,
      ].map((path) => request(path, { ip: "10.0.0.15" }))
    );

    expect(responses.map((response) => response.status)).toStrictEqual([
      401, 401, 401, 401,
    ]);
  });

  it("documents the organization routes with the session scheme", async () => {
    const response = await request("/openapi.json", { ip: "10.0.0.16" });
    const document: {
      paths: Record<string, { get?: { security?: unknown; tags?: string[] } }>;
    } = await response.json();

    const members =
      document.paths["/api/organizations/{organizationId}/members"]?.get;

    expect(Object.keys(document.paths)).toStrictEqual(
      expect.arrayContaining([
        "/api/me/organizations",
        "/api/me/invitations",
        "/api/organizations/{organizationId}/members",
        "/api/organizations/{organizationId}/invitations",
      ])
    );
    expect(members?.tags).toStrictEqual(["Organizations"]);
    expect(members?.security).toStrictEqual([{ sessionCookie: [] }]);
  });
});
