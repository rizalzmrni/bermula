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
});
