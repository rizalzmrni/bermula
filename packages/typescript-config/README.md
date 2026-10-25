# @bermula/typescript-config

Preset `tsconfig` bersama. Semua kode di-bundle (Vite / wrangler), jadi preset
memakai `module: "Preserve"` + `moduleResolution: "Bundler"` dan `noEmit`;
TypeScript hanya dipakai untuk type-check.

| Preset       | Untuk                                                                      | `lib`                            |
| ------------ | -------------------------------------------------------------------------- | -------------------------------- |
| `base.json`  | Worker (`apps/api`), paket murni (`core`, `env`, `db`, ...), skrip tooling | `ES2024` (tanpa DOM)             |
| `react.json` | `apps/app`, `apps/web`, paket React (`design-system`, `data`, `email`)     | `ES2024` + DOM, `jsx: react-jsx` |

## Keputusan penting

- **`types: []`** — tidak ada tipe global yang ikut otomatis. Setiap workspace
  menambahkan sendiri yang ia butuhkan, agar global Node/Bun (`Buffer`, `Bun`)
  tidak lolos type-check di kode Worker padahal tidak ada di runtime `workerd`.
- **`erasableSyntaxOnly`** — menolak `enum`, `namespace`, dan parameter
  properties (sesuai aturan "tanpa `enum`" di `CLAUDE.md`).
- **`verbatimModuleSyntax`** — impor tipe wajib `import type`, agar bundler
  tidak menyertakan modul yang hanya dipakai sebagai tipe.
- **`noUncheckedIndexedAccess`** — `arr[0]` bertipe `T | undefined`.
- Path relatif (`include`, `rootDirs`) dan `types` ditulis di tsconfig
  workspace, bukan di preset, karena di-resolve relatif terhadap file
  konfigurasinya.

## Contoh pemakaian

Worker (`apps/api/tsconfig.json`), tipe dari `wrangler types`:

```json
{
  "extends": "@bermula/typescript-config/base.json",
  "compilerOptions": { "types": ["./worker-configuration.d.ts"] },
  "include": ["src"]
}
```

React Router (`apps/app/tsconfig.json`), tipe route dari `react-router typegen`:

```json
{
  "extends": "@bermula/typescript-config/react.json",
  "compilerOptions": {
    "types": ["vite/client", "./worker-configuration.d.ts"],
    "rootDirs": [".", "./.react-router/types"]
  },
  "include": ["app", "workers", ".react-router/types/**/*"]
}
```

Skrip tooling Node (mis. `packages/db` untuk `drizzle.config.ts`) menambahkan
`"types": ["node"]` dan memasang `@types/node` dari `catalog`.

Setiap workspace memasang `"@bermula/typescript-config": "workspace:*"` dan
`"typescript": "catalog:"` di `devDependencies`, lalu skrip
`"check-types": "tsc --noEmit"`.
