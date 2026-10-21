import { defineRelations } from "drizzle-orm";

/**
 * Relasi untuk relational query (`db.query.<table>.findMany({ with })`).
 * Saat tabel pertama dibuat di `src/schema/<domain>.ts`, impor tabelnya ke
 * sini dan daftarkan relasinya lewat callback kedua `defineRelations`.
 */
export const relations = defineRelations({});
