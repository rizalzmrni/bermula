// Tipe minimal `import.meta.env` agar paket ini bisa di-type-check tanpa
// `vite/client`. Di app, deklarasi Vite yang lebih lengkap yang dipakai.
type ImportMetaEnv = Readonly<Record<string, string | undefined>>;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
