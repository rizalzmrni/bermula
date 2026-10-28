# Rencana: Dashboard Pengguna & Organisasi Terpisah

> Status: **diusulkan 2026-10-28, menunggu persetujuan developer.** Menyentuh
> auth, scoping data, skema DB, pembayaran, dan webhook, jadi termasuk tugas
> **berisiko**. Setiap fase dikerjakan di branch/PR sendiri setelah disetujui.
> Bila disetujui, keputusan di bagian [Keputusan yang diubah](#keputusan-yang-diubah)
> dipindahkan ke `CLAUDE.md`, `packages/db/CLAUDE.md`, `packages/payments/CLAUDE.md`,
> dan `STATUS.md`.

## Latar belakang

Model saat ini:

- Setiap pengguna otomatis punya satu **organisasi pribadi** (`is_personal`),
  dan semua data di-scope ke **organisasi aktif di sesi**.
- **Pembayar = organisasi**: Checkout Polar memakai
  `external_customer_id` = ID organisasi.
- `apps/app` hanya punya satu dashboard; belum ada UI untuk membuat, berpindah,
  atau mengelola organisasi. Email undangan menautkan ke `/accept-invitation/<id>`
  yang belum ada (404).

Masalah yang ditemukan saat uji staging (2026-10-28):

1. **Polar mengenali customer dari email.** Email customer unik per organisasi
   Polar dan `external_id` tidak bisa diubah. Satu email yang membayar untuk
   organisasi kedua ditolak ("You already have an active subscription"); bila
   langganan ganda diaktifkan pun, customer yang sama membawa `external_id`
   organisasi **pertama**, sehingga webhook organisasi kedua tidak bisa
   dipetakan dengan benar.
2. **Kebutuhan produk** (contoh marketplace): pengguna (pembeli) dan organisasi
   (toko) butuh dashboard dan langganan yang berbeda. Organisasi pribadi
   membuat "langganan pembeli" tidak jelas maknanya.

Fakta Polar yang sudah dicek (dokumentasi resmi + type definition
`@polar-sh/sdk` 1.0.2, API `2026-10`):

- Default satu customer hanya boleh satu langganan aktif; bisa diubah lewat
  pengaturan organisasi Polar `allow_multiple_subscriptions` (Settings →
  Subscriptions). Sandbox dan Production disetel terpisah.
- `metadata` pada Checkout **disalin ke subscription** hasil Checkout.
- Bila `external_customer_id` customer yang sudah ada dikirim, email di
  halaman Checkout terisi dan dikunci.

## Model baru

Pisahkan **siapa yang membayar** dari **siapa yang menerima manfaat**:

| Konsep                      | Isi                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Customer Polar (pembayar)   | **Pengguna**: `external_customer_id` = `user.id`. Satu orang = satu customer = satu Customer Portal.      |
| Subjek langganan (penerima) | `user` **atau** `organization`, dikirim sebagai `metadata` Checkout (`subject_type`, `subject_id`).       |
| Paket                       | Setiap paket punya `scope` (`user` / `organization`); produk Polar diberi metadata `plan` + `scope`.      |
| Konteks dashboard           | **Pribadi** (`/`) dan **organisasi** (`/o/:slug/...`), dengan navigasi dan halaman tagihan masing-masing. |
| Scoping data                | Data milik pengguna ber-`user_id`; data organisasi ber-`organization_id` dari URL, bukan dari sesi.       |

`allow_multiple_subscriptions` diaktifkan di Polar Sandbox dan Production agar
satu pengguna bisa punya langganan pribadi dan membayar untuk beberapa
organisasi.

### Struktur dashboard (`apps/app`)

```
/                         Dashboard pribadi (beranda, daftar organisasi, undangan masuk)
/settings/profile         Profil pengguna
/settings/security        (sudah ada) password, 2FA
/settings/billing         Langganan pribadi (paket scope `user`)
/settings/cookies         (sudah ada)
/organizations/new        Buat organisasi
/accept-invitation/:id    Terima / tolak undangan (memperbaiki tautan email 404)
/o/:slug                  Dashboard organisasi
/o/:slug/members          Anggota & undangan (owner/admin mengundang, ubah role, keluarkan)
/o/:slug/settings         Nama, slug, logo, hapus organisasi (owner)
/o/:slug/billing          Langganan organisasi (paket scope `organization`)
```

- **Pemilih konteks** di header sidebar (slot `header` `AppSidebar` yang sudah
  disiapkan): "Pribadi" + daftar organisasi + "Buat organisasi".
- Layout `routes/org-layout.tsx` untuk `/o/:slug`: loader mencari organisasi
  dari slug dan memastikan pengguna anggotanya (404 bila bukan, agar keberadaan
  organisasi lain tidak bocor).
- Konteks organisasi diambil dari **URL**, bukan `activeOrganizationId` sesi,
  supaya dua tab dengan organisasi berbeda tidak saling menimpa.

### API (`apps/api`)

- **Pribadi:** `GET /api/me` hanya mengembalikan pengguna (tanpa organisasi
  aktif). `GET /api/me/organizations` daftar keanggotaan + role.
  `GET /api/me/billing/subscription`, `POST /api/me/billing/checkout-sessions`.
- **Organisasi:** prefix `/api/organizations/{organizationId}/...`. Middleware
  baru `requireOrganizationMember` memeriksa keanggotaan ke DB dan menaruh
  `organizationId` + `membership` di context; service tetap menerima keduanya
  sebagai parameter eksplisit.
  - `GET .../billing/subscription`, `POST .../billing/checkout-sessions`
  - `/api/images` & `/api/documents` pindah ke `.../images` & `.../documents`.
- **Portal:** `POST /api/me/billing/portal-sessions` membuka Customer Portal
  milik pengguna, berisi semua langganan yang ia bayar (pribadi maupun
  organisasi).
- **Manajemen organisasi** (buat, undang, terima, ubah role, keluarkan, hapus)
  memakai endpoint plugin organization better-auth 1.7.12 yang sudah tersedia
  di `/api/auth/organization/*` (`create`, `check-slug`, `invite-member`,
  `accept-invitation`, `reject-invitation`, `list-user-invitations`,
  `list-members`, `update-member-role`, `remove-member`, `update`, `delete`,
  `leave`), dipanggil dari action app lewat Service Binding. Tidak perlu
  endpoint duplikat.

### Database (`packages/db`)

- **Organisasi pribadi dihapus** dari alur baru: hook `session.create.before`
  tidak lagi membuat organisasi; `activeOrganizationId` sesi tidak dipakai
  untuk scoping. Kolom `is_personal` dihapus. Organisasi pribadi yang sudah
  ada di dev/staging menjadi organisasi biasa (belum ada data produksi).
- `billing_subscriptions`:
  - tambah `subject_type` (`user` | `organization`), `user_id` (nullable, FK
    `auth_users` cascade), `organization_id` menjadi nullable;
  - `check`: tepat satu dari `user_id` / `organization_id` terisi sesuai
    `subject_type`;
  - tambah `payer_user_id` (FK `auth_users`, `set null`) = pemilik customer
    Polar, untuk menentukan siapa yang boleh membuka Portal.
- Migrasi Drizzle baru; diterapkan ke Neon dev lalu staging. Baris langganan
  lama di dev/staging dihapus (data uji Sandbox).

### Pembayaran (`packages/payments` + `apps/api`)

- `createCheckout`: `external_customer_id` = `user.id`, `metadata` =
  `{ subject_type, subject_id }`.
- Webhook: subjek dibaca dari `subscription.metadata`, pembayar dari
  `customer.external_id`. Subjek divalidasi ke DB (organisasi masih ada dan
  pembayar anggotanya saat Checkout dibuat; pengguna masih ada). Subscription
  tanpa metadata subjek dilewati (`skipped`) dengan log, seperti sekarang.
- Katalog `packages/core/src/plans.ts`: tiap paket diberi `scope`; halaman
  harga `apps/web` menampilkan dua kelompok (pribadi & organisasi) bila
  keduanya dipakai.
- Otorisasi Checkout organisasi tetap owner/admin. `ALREADY_SUBSCRIBED` dicek
  per subjek.

## Fase

| Fase | Isi                                                                                                                                                                  | Bergantung |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A    | Manajemen organisasi di app: pemilih konteks, buat organisasi, layout `/o/:slug`, anggota & undangan, `/accept-invitation`                                           | —          |
| B    | Scoping via URL: `requireOrganizationMember`, route `/api/organizations/{id}/...`, `/api/me` tanpa organisasi, hapus organisasi pribadi + migrasi                    | A          |
| C    | Tagihan per subjek: skema `billing_subscriptions`, Checkout customer = pengguna, webhook baca metadata, halaman tagihan pribadi & organisasi, `plans.ts` ber-`scope` | B          |
| D    | Uji di staging (data dikosongkan): satu email membayar pribadi + dua organisasi; update dokumentasi & `STATUS.md`                                                    | C          |

Setiap fase: test service/middleware baru, OpenAPI diperbarui, `check-types`,
`check`, `test` lolos, daftar periksa `DESIGN.md` untuk UI.

## Keputusan yang diubah

Bila disetujui, menggantikan keputusan berikut:

- 2026-10-21 **Scoping data per-organisasi dari sesi aktif** → organisasi dari
  URL; data pribadi ber-`user_id`.
- 2026-10-24 **Organisasi pribadi otomatis** → dihapus.
- 2026-10-25/27 **Pembayar = organisasi** → pembayar = pengguna (customer
  Polar), subjek langganan = pengguna atau organisasi.

## Pertanyaan terbuka

1. **Pembayar keluar dari organisasi.** Usulan: langganan organisasi tetap
   aktif sampai dibatalkan; owner/admin melihat peringatan "pembayar bukan
   anggota lagi" dan hanya pembayar yang bisa membuka Portal. Pindah pembayar =
   batalkan lalu berlangganan ulang oleh owner lain.
2. **File pribadi.** Apakah pengguna juga butuh upload di dashboard pribadi
   (mis. avatar), atau `storage_files` tetap hanya untuk organisasi pada fase
   ini? Usulan: tetap organisasi saja; avatar menyusul.
3. **Batas paket gratis.** `plans.ts` menyebut "1 organisasi" untuk paket
   gratis; dengan model baru, batas jumlah organisasi bergantung pada paket
   **pribadi** pengguna. Apakah batas itu ditegakkan di fase C atau ditunda?
