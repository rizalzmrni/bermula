import { createPolarCore } from "@polar-sh/sdk/2026-10";
import type { PolarCore } from "@polar-sh/sdk/2026-10";

export type PolarClient = PolarCore;

/** Lingkungan Polar; token, produk, dan webhook sandbox terpisah dari production. */
export const POLAR_SERVER = {
  production: "production",
  sandbox: "sandbox",
} as const;

export type PolarServer = (typeof POLAR_SERVER)[keyof typeof POLAR_SERVER];

/**
 * Klien core Polar per request (token dari binding Worker). Klien core +
 * fungsi per operasi (lihat `gateway.ts`) agar hanya operasi yang dipakai ikut
 * ter-bundle. Versi API ditentukan path impor (`/2026-10`); naikkan bersama
 * upgrade paket.
 */
export const createPolarClient = ({
  accessToken,
  server,
}: {
  accessToken: string;
  server: PolarServer;
}): PolarClient => createPolarCore({ accessToken, environment: server });
