# Alur Git & Commit

`main` selalu dalam kondisi bisa di-deploy; satu branch per fitur/perbaikan.

## Branch

- Format: `tipe/deskripsi-singkat` (contoh `feat/polar-webhook`).
- Tipe branch = `type` commit:

  | Tipe       | Untuk apa                                        |
  | ---------- | ------------------------------------------------ |
  | `feat`     | fitur baru                                       |
  | `fix`      | perbaikan bug                                    |
  | `refactor` | merapikan kode tanpa mengubah perilaku           |
  | `perf`     | peningkatan performa                             |
  | `test`     | menambah/mengubah pengujian                      |
  | `docs`     | dokumentasi                                      |
  | `chore`    | hal teknis (config, pemeliharaan)                |
  | `build`    | sistem build / dependency yang memengaruhi build |
  | `ci`       | konfigurasi CI/CD                                |

- Deskripsi: huruf kecil, kata dipisah `-`, 2–4 kata, bahasa Inggris, tanpa
  spasi atau karakter khusus. Dengan issue tracker: `feat/42-email-notifications`.

```bash
git switch -c feat/nama-fitur
# ... kerja & commit (hook berjalan otomatis) ...
git switch main
git merge feat/nama-fitur      # lewat PR bila tim
git branch -d feat/nama-fitur
```

Merge ke `main` hanya bila `check-types`, `check`, dan `test` lolos.

## Commit (Conventional Commits)

```
type(scope opsional): subjek singkat

body opsional — jelaskan "kenapa", bukan "apa"

footer opsional — mis. Closes #42
```

- `type`: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`.
- `scope`: nama app/paket/fitur (`web`, `app`, `api`, `db`, `auth`, `core`,
  `design-system`, `storage`, `payments`, dll.).
- Subjek: bahasa Inggris, mode perintah ("add"), huruf kecil, tanpa titik akhir,
  maks. 72 karakter. Contoh: `feat(auth): add password reset flow`.
- Breaking change: `!` setelah type/scope + footer `BREAKING CHANGE:`.
- Commit atomik: satu perubahan logis per commit; jangan campur fitur dan refactor.

## Penegakan otomatis (Husky + commitlint)

- `pre-commit`: lint-staged menjalankan `bunx ultracite fix` pada file yang
  di-stage, lalu `turbo run check-types --affected` (hanya paket yang berubah,
  agar tetap cepat seiring monorepo membesar).
- `pre-push` dan CI: `check-types`, `check`, dan `test` penuh. CI ada di
  `.github/workflows/ci.yml` (GitHub Actions, setiap PR dan push ke `main`,
  tanpa secret). Saat meng-upgrade bun, samakan `bun-version` di workflow dengan
  `devEngines` di `package.json`.
- `commit-msg`: commitlint memvalidasi Conventional Commits.
- Konfigurasi: `commitlint.config.ts` dan `.husky/`. Cek dukungan konfigurasi
  `.ts` di dokumentasi commitlint versi terpasang; gunakan `.mjs` hanya bila
  wajib, dengan komentar alasan.
- Jika hook gagal, perbaiki penyebabnya lalu commit ulang; jangan melewati hook.

## Kewenangan AI

- **Boleh:** buat branch, `git add`, commit setelah Definisi Selesai terpenuhi.
- **Minta izin dulu:** `git push`, merge ke `main`, rebase, hapus branch.
- **Dilarang:** `--force` push, `--no-verify`, `git reset --hard` tanpa izin eksplisit.

## Keamanan

Jangan pernah commit secret, `.env*` (kecuali `.env.example`), atau `.dev.vars`.
Pastikan pola ini ada di `.gitignore`.
