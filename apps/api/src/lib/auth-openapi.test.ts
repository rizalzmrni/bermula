import { describe, expect, it } from "vitest";

import { mergeAuthDocument } from "./auth-openapi";
import type { AuthOpenAPIDocument } from "./auth-openapi";

const apiDocument = {
  components: { schemas: { Account: { type: "object" as const } } },
  info: { title: "API", version: "0.1.0" },
  openapi: "3.1.0",
  paths: { "/api/me": { get: { responses: {} } } },
};

const authDocument = {
  components: {
    schemas: {
      Account: { properties: {}, type: "object" },
      User: { properties: {}, type: "object" },
    },
    securitySchemes: {
      apiKeyCookie: { description: "", in: "cookie", name: "", type: "apiKey" },
      bearerAuth: { description: "", scheme: "bearer", type: "http" },
    },
  },
  info: { description: "", title: "Better Auth", version: "1.1.0" },
  openapi: "3.1.1",
  paths: {
    "/organization/create": {
      post: { security: [{ bearerAuth: [] }], tags: ["Organization"] },
    },
    "/sign-in/email": {
      post: {
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        tags: ["Default"],
      },
    },
  },
  security: [],
  servers: [],
  tags: [],
} satisfies AuthOpenAPIDocument;

describe(mergeAuthDocument, () => {
  const merged = mergeAuthDocument(apiDocument, authDocument);

  it("prefixes auth paths and keeps the api paths", () => {
    expect(Object.keys(merged.paths ?? {})).toStrictEqual([
      "/api/me",
      "/api/auth/organization/create",
      "/api/auth/sign-in/email",
    ]);
  });

  it("groups operations under Auth tags with an optional session cookie", () => {
    const createOrganization =
      merged.paths?.["/api/auth/organization/create"]?.post;
    const signIn = merged.paths?.["/api/auth/sign-in/email"]?.post;

    expect(createOrganization?.tags).toStrictEqual(["Auth: Organization"]);
    expect(signIn?.tags).toStrictEqual(["Auth"]);
    expect(signIn?.security).toStrictEqual([{}, { sessionCookie: [] }]);
  });

  it("prefixes auth models and their refs without touching api schemas", () => {
    expect(Object.keys(merged.components?.schemas ?? {})).toStrictEqual([
      "Account",
      "AuthAccount",
      "AuthUser",
    ]);
    expect(JSON.stringify(merged.paths)).toContain(
      '"#/components/schemas/AuthUser"'
    );
  });
});
