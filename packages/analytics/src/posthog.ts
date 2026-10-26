import type { PostHog } from "posthog-js";

export interface PostHogConfig {
  projectToken: string;
  /** Host ingest sesuai region project, mis. `https://eu.i.posthog.com`. */
  host: string;
}

export type PostHogClient = Pick<
  PostHog,
  | "group"
  | "has_opted_out_capturing"
  | "identify"
  | "opt_in_capturing"
  | "opt_out_capturing"
  | "reset"
>;

/**
 * posthog-js dimuat dengan dynamic import setelah persetujuan, jadi pengunjung
 * yang menolak tidak mengunduh SDK sama sekali (juga tidak dijalankan saat SSR).
 *
 * `defaults` mengaktifkan `capture_pageview: "history_change"`: navigasi
 * client-side React Router (History API) tercatat sebagai `$pageview` tanpa
 * kode tambahan. Profil person hanya untuk pengguna yang login (`identify`).
 */
export const loadPostHog = async ({
  host,
  projectToken,
}: PostHogConfig): Promise<PostHogClient> => {
  const { posthog } = await import("posthog-js");
  posthog.init(projectToken, {
    api_host: host,
    capture_exceptions: true,
    defaults: "2026-08-30",
    person_profiles: "identified_only",
  });
  // Pengunjung pernah mencabut persetujuan di perangkat ini, lalu menyetujui lagi.
  if (posthog.has_opted_out_capturing()) {
    posthog.opt_in_capturing();
  }
  return posthog;
};

/** Persetujuan dicabut: hapus identitas tersimpan, lalu berhenti mengirim. */
export const disablePostHog = (client: PostHogClient) => {
  // `reset()` juga menghapus status opt-out, jadi harus sebelum `opt_out_capturing()`.
  client.reset();
  client.opt_out_capturing();
};
