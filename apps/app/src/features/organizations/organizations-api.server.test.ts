import { describe, expect, it } from "vitest";

import type { ApiBinding } from "../../lib/api-client";
import {
  acceptInvitation,
  cancelInvitation,
  createOrganization,
  deleteOrganization,
  getOrganizationErrorMessage,
  inviteMember,
  leaveOrganization,
  readAcceptedOrganizationId,
  rejectInvitation,
  removeMember,
  updateMemberRole,
  updateOrganization,
} from "./organizations-api.server";

const APP_REQUEST = new Request("http://localhost:5173/o/toko-a/members", {
  headers: { cookie: "session=abc", origin: "http://localhost:5173" },
  method: "POST",
});

const ORGANIZATION_ID = "0b5f6f0e-2d8a-4c4e-9a43-5c5f1d4a7e10";
const MEMBER_ID = "6a1d2b1c-8f3e-4b7a-9d2c-1e0f5a6b7c8d";
const INVITATION_ID = "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

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

describe("organization api calls", () => {
  it.each([
    {
      body: {
        keepCurrentActiveOrganization: true,
        name: "Toko A",
        slug: "toko-a",
      },
      call: (api: ApiBinding) =>
        createOrganization({
          api,
          input: { name: "Toko A", slug: "toko-a" },
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/create",
    },
    {
      body: {
        data: { name: "Toko B", slug: "toko-b" },
        organizationId: ORGANIZATION_ID,
      },
      call: (api: ApiBinding) =>
        updateOrganization({
          api,
          input: { name: "Toko B", slug: "toko-b" },
          organizationId: ORGANIZATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/update",
    },
    {
      body: { organizationId: ORGANIZATION_ID },
      call: (api: ApiBinding) =>
        deleteOrganization({
          api,
          organizationId: ORGANIZATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/delete",
    },
    {
      body: { organizationId: ORGANIZATION_ID },
      call: (api: ApiBinding) =>
        leaveOrganization({
          api,
          organizationId: ORGANIZATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/leave",
    },
    {
      body: {
        email: "sari@example.com",
        organizationId: ORGANIZATION_ID,
        role: "admin",
      },
      call: (api: ApiBinding) =>
        inviteMember({
          api,
          email: "sari@example.com",
          organizationId: ORGANIZATION_ID,
          request: APP_REQUEST,
          role: "admin",
        }),
      path: "/api/auth/organization/invite-member",
    },
    {
      body: { invitationId: INVITATION_ID },
      call: (api: ApiBinding) =>
        cancelInvitation({
          api,
          invitationId: INVITATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/cancel-invitation",
    },
    {
      body: {
        memberId: MEMBER_ID,
        organizationId: ORGANIZATION_ID,
        role: "member",
      },
      call: (api: ApiBinding) =>
        updateMemberRole({
          api,
          memberId: MEMBER_ID,
          organizationId: ORGANIZATION_ID,
          request: APP_REQUEST,
          role: "member",
        }),
      path: "/api/auth/organization/update-member-role",
    },
    {
      body: { memberIdOrEmail: MEMBER_ID, organizationId: ORGANIZATION_ID },
      call: (api: ApiBinding) =>
        removeMember({
          api,
          memberId: MEMBER_ID,
          organizationId: ORGANIZATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/remove-member",
    },
    {
      body: { invitationId: INVITATION_ID },
      call: (api: ApiBinding) =>
        acceptInvitation({
          api,
          invitationId: INVITATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/accept-invitation",
    },
    {
      body: { invitationId: INVITATION_ID },
      call: (api: ApiBinding) =>
        rejectInvitation({
          api,
          invitationId: INVITATION_ID,
          request: APP_REQUEST,
        }),
      path: "/api/auth/organization/reject-invitation",
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
});

describe(readAcceptedOrganizationId, () => {
  it("reads the organization of the new membership", async () => {
    await expect(
      readAcceptedOrganizationId(
        Response.json({
          invitation: { id: INVITATION_ID },
          member: { organizationId: ORGANIZATION_ID },
        })
      )
    ).resolves.toBe(ORGANIZATION_ID);
  });

  it("returns null for an unexpected body", async () => {
    await expect(
      readAcceptedOrganizationId(Response.json({ member: null }))
    ).resolves.toBeNull();
  });
});

describe(getOrganizationErrorMessage, () => {
  it("explains a taken slug", async () => {
    await expect(
      getOrganizationErrorMessage(
        errorResponse(400, "ORGANIZATION_SLUG_ALREADY_TAKEN")
      )
    ).resolves.toBe("Alamat organisasi ini sudah dipakai.");
  });

  it("explains rate limiting before reading the body", async () => {
    await expect(
      getOrganizationErrorMessage(errorResponse(429))
    ).resolves.toMatch(/Terlalu banyak percobaan/u);
  });

  it("falls back to a generic message for unknown codes", async () => {
    await expect(
      getOrganizationErrorMessage(errorResponse(500, "SOMETHING_ELSE"))
    ).resolves.toBe("Gagal menyimpan perubahan. Silakan coba lagi.");
  });
});
