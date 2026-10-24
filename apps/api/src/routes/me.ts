import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "../lib/errors";
import { createRouter } from "../lib/router";
import { requireAuth } from "../middleware/require-auth";
import { SESSION_SECURITY } from "../openapi";
import { getActiveMembership } from "../services/account";

const AccountSchema = z
  .object({
    organization: z.object({
      id: z.uuid(),
      isPersonal: z.boolean().openapi({
        description: "Organisasi pribadi yang dibuat otomatis untuk pengguna.",
      }),
      logo: z.string().nullable(),
      name: z.string().openapi({ example: "Budi" }),
      role: z.string().openapi({ example: "owner" }),
      slug: z.string().openapi({ example: "personal-8d3c1f0e" }),
    }),
    user: z.object({
      email: z.email().openapi({ example: "budi@example.com" }),
      id: z.uuid(),
      image: z.string().nullable(),
      name: z.string().openapi({ example: "Budi" }),
      role: z.string().openapi({
        description:
          "Role level aplikasi (plugin admin), bukan role organisasi.",
        example: "user",
      }),
      twoFactorEnabled: z.boolean(),
    }),
  })
  .openapi("Account");

const getMeRoute = createRoute({
  description:
    "Pengguna yang sedang login beserta organisasi aktif di sesinya dan role-nya di organisasi tersebut.",
  method: "get",
  middleware: [requireAuth] as const,
  path: "/api/me",
  responses: {
    200: {
      content: { "application/json": { schema: AccountSchema } },
      description: "Akun pengguna saat ini.",
    },
    401: errorResponse("Belum login."),
    403: errorResponse(
      "Tidak ada organisasi aktif atau pengguna bukan anggotanya."
    ),
    429: errorResponse("Terlalu banyak permintaan."),
  },
  security: SESSION_SECURITY,
  summary: "Akun saat ini",
  tags: ["Account"],
});

export const meRoutes = createRouter().openapi(getMeRoute, async (c) => {
  const { db, organizationId, user } = c.var;
  const organization = await getActiveMembership({
    db,
    organizationId,
    userId: user.id,
  });

  return c.json(
    {
      organization,
      user: {
        email: user.email,
        id: user.id,
        image: user.image ?? null,
        name: user.name,
        // Kolom NOT NULL di DB; tipe sesi better-auth menandainya opsional.
        role: user.role ?? "user",
        twoFactorEnabled: user.twoFactorEnabled ?? false,
      },
    },
    200
  );
});
