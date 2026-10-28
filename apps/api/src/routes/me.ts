import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "../lib/errors";
import { createRouter } from "../lib/router";
import { requireUser } from "../middleware/require-user";
import { SESSION_SECURITY } from "../openapi";

const AccountSchema = z
  .object({
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
    "Pengguna yang sedang login. Organisasinya ada di `/api/me/organizations`.",
  method: "get",
  middleware: [requireUser] as const,
  path: "/api/me",
  responses: {
    200: {
      content: { "application/json": { schema: AccountSchema } },
      description: "Akun pengguna saat ini.",
    },
    401: errorResponse("Belum login."),
    429: errorResponse("Terlalu banyak permintaan."),
  },
  security: SESSION_SECURITY,
  summary: "Akun saat ini",
  tags: ["Account"],
});

export const meRoutes = createRouter().openapi(getMeRoute, (c) => {
  const { user } = c.var;

  return c.json(
    {
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
