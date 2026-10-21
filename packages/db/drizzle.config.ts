import { defineConfig } from "drizzle-kit";

// drizzle-kit berjalan di Node (CLI), jadi ini satu-satunya tempat paket ini
// membaca `process.env`. Kode runtime menerima `databaseUrl` sebagai parameter.
const loadEnvFile = () => {
  try {
    process.loadEnvFile();
  } catch (error) {
    const isMissingFile =
      error instanceof Error && "code" in error && error.code === "ENOENT";
    // Di CI env datang dari environment, bukan file `.env`.
    if (!isMissingFile) {
      throw error;
    }
  }
};

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum diset. Salin packages/db/.env.example ke packages/db/.env."
  );
}

export default defineConfig({
  dbCredentials: { url: databaseUrl },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema",
});
