import type { Db } from "@bermula/db/client";
import { member, organization, user } from "@bermula/db/schema/auth";
import { asc, eq } from "drizzle-orm";

/**
 * Setiap pengguna punya satu organisasi pribadi, sehingga semua data selalu
 * ter-scope ke organisasi. Aplikasi yang tidak butuh fitur tim cukup
 * menyembunyikan UI organisasi.
 */
export interface PersonalOrganizationStore {
  /** Organisasi pertama yang diikuti pengguna, `null` bila belum ada. */
  findFirstOrganizationId: (userId: string) => Promise<string | null>;
  /** Membuat organisasi pribadi + keanggotaan owner, lalu mengembalikan id-nya. */
  createPersonalOrganization: (userId: string) => Promise<string>;
}

/** Slug unik per pengguna; constraint unik ini juga mencegah duplikat saat login bersamaan. */
export const toPersonalOrganizationSlug = (userId: string): string =>
  `personal-${userId}`;

export const createPersonalOrganizationStore = (
  db: Db
): PersonalOrganizationStore => ({
  createPersonalOrganization: async (userId) => {
    const [owner] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!owner) {
      throw new Error(`User ${userId} not found`);
    }

    // Id dibuat di sini agar kedua insert bisa masuk satu batch; neon-http
    // menjalankan batch sebagai satu transaksi, jadi tidak ada organisasi
    // tanpa owner bila insert kedua gagal.
    const organizationId = crypto.randomUUID();
    await db.batch([
      db.insert(organization).values({
        id: organizationId,
        isPersonal: true,
        name: owner.name,
        slug: toPersonalOrganizationSlug(userId),
      }),
      db.insert(member).values({ organizationId, role: "owner", userId }),
    ]);

    return organizationId;
  },
  findFirstOrganizationId: async (userId) => {
    const [membership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId))
      .orderBy(asc(member.createdAt))
      .limit(1);

    return membership?.organizationId ?? null;
  },
});

/**
 * Organisasi aktif untuk sesi baru. Organisasi pribadi dibuat di sini (saat
 * sesi pertama), bukan saat sign-up, karena pengguna email baru mendapat sesi
 * setelah verifikasi; sekaligus memulihkan pengguna yang belum punya organisasi.
 */
export const resolveActiveOrganizationId = async ({
  store,
  userId,
}: {
  store: PersonalOrganizationStore;
  userId: string;
}): Promise<string> => {
  const existing = await store.findFirstOrganizationId(userId);
  if (existing) {
    return existing;
  }

  try {
    return await store.createPersonalOrganization(userId);
  } catch (error) {
    // Login bersamaan: request lain sudah membuat organisasi pribadi lebih dulu.
    const created = await store.findFirstOrganizationId(userId);
    if (created) {
      return created;
    }
    throw error;
  }
};
