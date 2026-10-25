import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { PostHog } from "posthog-js";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AnalyticsIdentify,
  AnalyticsProvider,
  getAnalyticsServices,
} from "./analytics-provider";
import type { Consent } from "./consent";

type Fn = (...args: unknown[]) => void;

const posthog = vi.hoisted(() => ({
  group: vi.fn<Fn>(),
  has_opted_out_capturing: vi.fn<() => boolean>(() => false),
  identify: vi.fn<Fn>(),
  init: vi.fn<Fn>(),
  opt_in_capturing: vi.fn<Fn>(),
  opt_out_capturing: vi.fn<Fn>(),
  reset: vi.fn<Fn>(),
}));

// Mock hanya berisi method yang dipanggil `loadPostHog`/provider, bukan seluruh SDK.
vi.mock(import("posthog-js"), () => ({
  posthog: posthog as unknown as PostHog,
}));

const GA_ID = "G-TEST123";
const POSTHOG = { host: "https://eu.i.posthog.com", projectToken: "phc_test" };

const NavigateButton = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/harga?ref=x")} type="button">
      Ke harga
    </button>
  );
};

const renderWithConsent = (consent: Consent | null, children?: ReactNode) => {
  const tree = (value: Consent | null) => (
    <MemoryRouter initialEntries={["/"]}>
      <AnalyticsProvider
        consent={value}
        googleAnalyticsId={GA_ID}
        posthog={POSTHOG}
      >
        <NavigateButton />
        {children}
      </AnalyticsProvider>
    </MemoryRouter>
  );
  const view = render(tree(consent));
  return { rerender: (value: Consent | null) => view.rerender(tree(value)) };
};

const gaScript = () =>
  document.head.querySelector<HTMLScriptElement>("#google-analytics");

/** Event gtag di dataLayer (objek `arguments`) sebagai array biasa. */
const gtagCalls = () =>
  (window.dataLayer ?? []).map((entry) =>
    // Objek `arguments`: nilai berindeks 0..n sesuai urutan argumen gtag.
    Object.values(entry as Record<string, unknown>)
  );

const pageViews = () =>
  gtagCalls().filter(
    ([command, name]) => command === "event" && name === "page_view"
  );

describe(AnalyticsProvider, () => {
  afterEach(() => {
    cleanup();
    gaScript()?.remove();
    window.dataLayer = undefined;
    window.gtag = undefined;
    vi.clearAllMocks();
  });

  it("loads nothing before the visitor consents", async () => {
    renderWithConsent(null);
    renderWithConsent("denied");

    // Dynamic import posthog-js (bila keliru dipicu) diberi waktu selesai.
    await vi.dynamicImportSettled();
    expect(gaScript()).toBeNull();
    expect(window.dataLayer).toBeUndefined();
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("loads Google Analytics once and sends a page view per navigation", () => {
    renderWithConsent("granted");

    expect(gaScript()?.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-TEST123"
    );
    expect(gtagCalls()).toContainEqual([
      "config",
      GA_ID,
      { send_page_view: false },
    ]);
    expect(pageViews()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Ke harga" }));

    expect(pageViews()).toHaveLength(2);
    expect(pageViews()[1]?.[2]).toMatchObject({
      page_location: "http://localhost:3000/harga?ref=x",
    });
  });

  it("starts PostHog and identifies the signed-in user with their organization", async () => {
    renderWithConsent(
      "granted",
      <AnalyticsIdentify
        organization={{ id: "org_1", name: "Tim A" }}
        userId="user_1"
      />
    );

    await waitFor(() =>
      expect(posthog.identify).toHaveBeenCalledWith("user_1")
    );
    expect(posthog.init).toHaveBeenCalledWith("phc_test", {
      api_host: "https://eu.i.posthog.com",
      capture_exceptions: true,
      defaults: "2026-08-30",
      person_profiles: "identified_only",
    });
    expect(posthog.group).toHaveBeenCalledWith("organization", "org_1", {
      name: "Tim A",
    });
  });

  it("stops both trackers when consent is withdrawn", async () => {
    const view = renderWithConsent("granted");
    await waitFor(() => expect(posthog.init).toHaveBeenCalledOnce());

    view.rerender("denied");

    expect(Reflect.get(window, `ga-disable-${GA_ID}`)).toBeTruthy();
    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthog.reset.mock.invocationCallOrder[0]).toBeLessThan(
      posthog.opt_out_capturing.mock.invocationCallOrder[0] ?? 0
    );
  });
});

describe(getAnalyticsServices, () => {
  it("lists only configured services", () => {
    expect(
      getAnalyticsServices({ googleAnalyticsId: GA_ID, posthog: POSTHOG })
    ).toStrictEqual(["Google Analytics", "PostHog"]);
    expect(getAnalyticsServices({ posthog: POSTHOG })).toStrictEqual([
      "PostHog",
    ]);
    expect(getAnalyticsServices({})).toStrictEqual([]);
  });
});
