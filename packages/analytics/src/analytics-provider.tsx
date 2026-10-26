import { createContext, use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";

import { CONSENT } from "./consent";
import type { Consent } from "./consent";
import {
  disableGoogleAnalytics,
  loadGoogleAnalytics,
  trackGoogleAnalyticsPageView,
} from "./google-analytics";
import { disablePostHog, loadPostHog } from "./posthog";
import type { PostHogClient, PostHogConfig } from "./posthog";

export interface AnalyticsIdentity {
  userId: string;
  /** Dipakai sebagai group `organization` PostHog (analitik per organisasi). */
  organization: { id: string; name: string } | null;
}

interface AnalyticsContextValue {
  /** Dipanggil saat pengguna diketahui (setelah login). */
  identify: (identity: AnalyticsIdentity) => void;
  /** Dipanggil saat logout agar event berikutnya tidak terkait pengguna lama. */
  reset: () => void;
}

// Tanpa persetujuan/SDK, aksi analitik sengaja diabaikan.
const ignore = () => null;

const NOOP_ANALYTICS: AnalyticsContextValue = {
  identify: ignore,
  reset: ignore,
};

const AnalyticsContext = createContext<AnalyticsContextValue>(NOOP_ANALYTICS);

/** Aman dipanggil tanpa provider atau tanpa persetujuan: semua aksi jadi no-op. */
export const useAnalytics = () => use(AnalyticsContext);

const useGoogleAnalytics = (measurementId: string | undefined) => {
  const location = useLocation();

  useEffect(() => {
    if (!measurementId) {
      return;
    }
    loadGoogleAnalytics(measurementId);
    return () => disableGoogleAnalytics(measurementId);
  }, [measurementId]);

  // Page view pertama setelah dimuat, lalu tiap navigasi client-side.
  const page = `${location.pathname}${location.search}`;
  useEffect(() => {
    if (measurementId) {
      trackGoogleAnalyticsPageView(page);
    }
  }, [measurementId, page]);
};

const usePostHogClient = (config: PostHogConfig | undefined) => {
  const [client, setClient] = useState<PostHogClient | null>(null);
  const projectToken = config?.projectToken;
  const host = config?.host;

  useEffect(() => {
    if (!(projectToken && host)) {
      return;
    }
    let active = true;
    let loaded: PostHogClient | null = null;
    const load = async () => {
      try {
        loaded = await loadPostHog({ host, projectToken });
      } catch {
        // Pemblokir iklan sering memblokir SDK; aplikasi tetap jalan tanpa analitik.
        return;
      }
      if (active) {
        setClient(loaded);
      } else {
        disablePostHog(loaded);
      }
    };
    load();

    return () => {
      active = false;
      if (loaded) {
        disablePostHog(loaded);
      }
      setClient(null);
    };
  }, [projectToken, host]);

  return client;
};

export interface AnalyticsConfig {
  /** Kosong = Google Analytics mati (mis. apps/app). */
  googleAnalyticsId?: string;
  /** Kosong = PostHog mati. */
  posthog?: PostHogConfig;
}

/** Konfigurasi PostHog dari pasangan env opsional; `undefined` bila belum diisi. */
export const toPostHogConfig = ({
  host,
  projectToken,
}: {
  host: string | undefined;
  projectToken: string | undefined;
}): PostHogConfig | undefined =>
  host && projectToken ? { host, projectToken } : undefined;

/**
 * Nama layanan yang aktif, untuk teks banner. Daftar kosong = tidak ada pelacak
 * yang dikonfigurasi, jadi banner persetujuan tidak perlu ditampilkan.
 */
export const getAnalyticsServices = ({
  googleAnalyticsId,
  posthog,
}: AnalyticsConfig) => [
  ...(googleAnalyticsId ? ["Google Analytics"] : []),
  ...(posthog ? ["PostHog"] : []),
];

interface AnalyticsProviderProps extends AnalyticsConfig {
  /** Dari cookie (root loader); pelacak hanya dimuat bila `granted`. */
  consent: Consent | null;
  children: ReactNode;
}

/**
 * Memuat GA dan/atau PostHog hanya setelah persetujuan. Mencabut persetujuan
 * menghentikan keduanya tanpa memuat ulang halaman.
 */
export const AnalyticsProvider = ({
  consent,
  googleAnalyticsId,
  posthog,
  children,
}: AnalyticsProviderProps) => {
  const granted = consent === CONSENT.granted;
  useGoogleAnalytics(granted ? googleAnalyticsId : undefined);
  const client = usePostHogClient(granted ? posthog : undefined);

  const value = useMemo<AnalyticsContextValue>(
    () =>
      client
        ? {
            identify: ({ organization, userId }) => {
              client.identify(userId);
              if (organization) {
                client.group("organization", organization.id, {
                  name: organization.name,
                });
              }
            },
            reset: () => client.reset(),
          }
        : NOOP_ANALYTICS,
    [client]
  );

  return <AnalyticsContext value={value}>{children}</AnalyticsContext>;
};

/** Menghubungkan pengguna yang login ke event analitik; tidak merender apa pun. */
export const AnalyticsIdentify = (identity: AnalyticsIdentity) => {
  const { identify } = useAnalytics();
  const { organization, userId } = identity;
  const organizationId = organization?.id;
  const organizationName = organization?.name;

  useEffect(() => {
    identify({
      organization:
        organizationId && organizationName !== undefined
          ? { id: organizationId, name: organizationName }
          : null,
      userId,
    });
  }, [identify, userId, organizationId, organizationName]);

  return null;
};
