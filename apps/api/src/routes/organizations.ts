import {
  ORGANIZATION_ROLE,
  isOrganizationManager,
} from "@bermula/core/organizations";
import { createRoute, z } from "@hono/zod-openapi";

import { ApiError, errorResponse } from "../lib/errors";
import {
  ORGANIZATION_PATH,
  OrganizationParamsSchema,
} from "../lib/organization-params";
import { createRouter } from "../lib/router";
import { requireOrganizationMember } from "../middleware/require-organization-member";
import { requireUser } from "../middleware/require-user";
import { SESSION_SECURITY } from "../openapi";
import {
  listMembers,
  listOrganizationInvitations,
  listUserInvitations,
  listUserOrganizations,
} from "../services/organizations";

const RoleSchema = z.string().openapi({
  description:
    "Role better-auth (`owner`, `admin`, `member`); bisa berisi beberapa nilai dipisah koma.",
  example: ORGANIZATION_ROLE.admin,
});

const OrganizationSummarySchema = z
  .object({
    createdAt: z.iso.datetime(),
    id: z.uuid(),
    logo: z.string().nullable(),
    name: z.string().openapi({ example: "Toko Budi" }),
    role: RoleSchema,
    slug: z.string().openapi({
      description: "Dipakai di URL dashboard organisasi (`/o/:slug`).",
      example: "toko-budi",
    }),
  })
  .openapi("OrganizationSummary");

const UserInvitationSchema = z
  .object({
    expiresAt: z.iso.datetime(),
    id: z.uuid(),
    inviterName: z.string().openapi({ example: "Budi" }),
    organizationName: z.string().openapi({ example: "Toko Budi" }),
    role: RoleSchema,
  })
  .openapi("UserInvitation");

const MemberSchema = z
  .object({
    createdAt: z.iso.datetime().openapi({ description: "Waktu bergabung." }),
    email: z.email().openapi({ example: "sari@example.com" }),
    id: z.uuid().openapi({
      description: "ID keanggotaan (`memberId` di endpoint better-auth).",
    }),
    image: z.string().nullable(),
    name: z.string().openapi({ example: "Sari" }),
    role: RoleSchema,
    userId: z.uuid(),
  })
  .openapi("OrganizationMember");

const OrganizationInvitationSchema = z
  .object({
    createdAt: z.iso.datetime(),
    email: z.email().openapi({ example: "sari@example.com" }),
    expiresAt: z.iso.datetime(),
    id: z.uuid(),
    inviterName: z.string().openapi({ example: "Budi" }),
    role: RoleSchema,
  })
  .openapi("OrganizationInvitation");

const AUTH_ERRORS = {
  401: errorResponse("Belum login."),
  429: errorResponse("Terlalu banyak permintaan."),
};

const ORGANIZATION_ERRORS = {
  ...AUTH_ERRORS,
  404: errorResponse(
    "Organisasi tidak ada atau pengguna bukan anggotanya (`ORGANIZATION_NOT_FOUND`)."
  ),
};

const shared = { security: SESSION_SECURITY, tags: ["Organizations"] };

/** Role kosong di undangan lama berarti role default better-auth. */
const toRole = (role: string | null) => role ?? ORGANIZATION_ROLE.member;

const listMyOrganizationsRoute = createRoute({
  ...shared,
  description:
    "Organisasi yang diikuti pengguna beserta role-nya, untuk pemilih organisasi dan dashboard pribadi.",
  method: "get",
  middleware: [requireUser] as const,
  path: "/api/me/organizations",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(OrganizationSummarySchema) },
      },
      description: "Daftar organisasi, urut nama.",
    },
    ...AUTH_ERRORS,
  },
  summary: "Organisasi saya",
});

const listMyInvitationsRoute = createRoute({
  ...shared,
  description:
    "Undangan organisasi yang masih terbuka untuk email pengguna. Terima atau tolak lewat `POST /api/auth/organization/accept-invitation` / `reject-invitation`.",
  method: "get",
  middleware: [requireUser] as const,
  path: "/api/me/invitations",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(UserInvitationSchema) },
      },
      description:
        "Undangan terbuka, yang paling cepat kedaluwarsa lebih dulu.",
    },
    ...AUTH_ERRORS,
  },
  summary: "Undangan saya",
});

const listMembersRoute = createRoute({
  ...shared,
  description:
    "Anggota organisasi. Bisa dibaca semua anggota; ubah role dan keluarkan anggota lewat endpoint better-auth `/api/auth/organization/*`.",
  method: "get",
  middleware: [requireOrganizationMember] as const,
  path: `${ORGANIZATION_PATH}/members`,
  request: { params: OrganizationParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(MemberSchema) } },
      description: "Anggota, urut waktu bergabung.",
    },
    ...ORGANIZATION_ERRORS,
  },
  summary: "Anggota organisasi",
});

const listInvitationsRoute = createRoute({
  ...shared,
  description:
    "Undangan yang belum dijawab dan belum kedaluwarsa. Hanya owner/admin, karena memuat email orang di luar organisasi.",
  method: "get",
  middleware: [requireOrganizationMember] as const,
  path: `${ORGANIZATION_PATH}/invitations`,
  request: { params: OrganizationParamsSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(OrganizationInvitationSchema) },
      },
      description: "Undangan terbuka, urut waktu dibuat.",
    },
    403: errorResponse("Bukan owner/admin (`FORBIDDEN`)."),
    ...ORGANIZATION_ERRORS,
  },
  summary: "Undangan organisasi",
});

export const organizationRoutes = createRouter()
  .openapi(listMyOrganizationsRoute, async (c) => {
    const rows = await listUserOrganizations({
      db: c.var.db,
      userId: c.var.user.id,
    });
    return c.json(
      rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      200
    );
  })
  .openapi(listMyInvitationsRoute, async (c) => {
    const rows = await listUserInvitations({
      db: c.var.db,
      email: c.var.user.email,
      now: new Date(),
    });
    return c.json(
      rows.map((row) => ({
        ...row,
        expiresAt: row.expiresAt.toISOString(),
        role: toRole(row.role),
      })),
      200
    );
  })
  .openapi(listMembersRoute, async (c) => {
    const rows = await listMembers({
      db: c.var.db,
      organizationId: c.var.organizationId,
    });
    return c.json(
      rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      200
    );
  })
  .openapi(listInvitationsRoute, async (c) => {
    if (!isOrganizationManager(c.var.membership.role)) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "Hanya owner atau admin yang bisa melihat undangan.",
        status: 403,
      });
    }
    const rows = await listOrganizationInvitations({
      db: c.var.db,
      now: new Date(),
      organizationId: c.var.organizationId,
    });
    return c.json(
      rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        role: toRole(row.role),
      })),
      200
    );
  });
