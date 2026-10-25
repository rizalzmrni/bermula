import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleConsentAction } from "./consent";
import { ConsentBanner } from "./consent-banner";
import { ConsentSettings } from "./consent-settings";

const SERVICES = ["Google Analytics", "PostHog"];

/**
 * Router uji: halaman `/harga` + route `/consent` dengan action asli
 * (`handleConsentAction`), sambil merekam pilihan yang dikirim.
 */
const renderPage = (element: ReactNode) => {
  const submitted = vi.fn<(choice: FormDataEntryValue | null) => void>();
  const Page = () => element;
  const Stub = createRoutesStub([
    { Component: Page, path: "/harga" },
    {
      action: async ({ request }) => {
        const form = await request.clone().formData();
        submitted(form.get("consent"));
        return await handleConsentAction(request);
      },
      path: "/consent",
    },
  ]);
  render(<Stub initialEntries={["/harga"]} />);
  return { submitted };
};

const pendingBanner = (
  <ConsentBanner consent={null} privacyHref="/privasi" services={SERVICES} />
);

describe(ConsentBanner, () => {
  afterEach(cleanup);

  it("asks a visitor who has not chosen yet, naming every service", async () => {
    renderPage(pendingBanner);

    const region = await screen.findByRole("region", {
      name: "Cookie analitik",
    });
    expect(region.textContent).toContain("Google Analytics dan PostHog");
    expect(
      screen
        .getByRole("link", { name: "Kebijakan privasi" })
        .getAttribute("href")
    ).toBe("/privasi");
  });

  it("offers reject and accept with the same visual weight", async () => {
    renderPage(pendingBanner);

    const reject = await screen.findByRole("button", { name: "Tolak" });
    const accept = screen.getByRole("button", { name: "Terima" });
    expect(reject.className).toBe(accept.className);
  });

  it("submits the choice and hides itself right away", async () => {
    const { submitted } = renderPage(pendingBanner);

    fireEvent.click(await screen.findByRole("button", { name: "Tolak" }));

    await waitFor(() => expect(submitted).toHaveBeenCalledWith("denied"));
    expect(
      screen.queryByRole("region", { name: "Cookie analitik" })
    ).toBeNull();
  });

  it("stays hidden once the visitor has chosen", async () => {
    renderPage(
      <>
        <p>Konten</p>
        <ConsentBanner
          consent="granted"
          privacyHref="/privasi"
          services={SERVICES}
        />
      </>
    );

    await screen.findByText("Konten");
    expect(screen.queryByRole("region")).toBeNull();
  });
});

describe(ConsentSettings, () => {
  afterEach(cleanup);

  it("shows the current choice and lets the visitor withdraw it", async () => {
    const { submitted } = renderPage(
      <ConsentSettings consent="granted" services={SERVICES} />
    );

    await expect(screen.findByText("Disetujui")).resolves.toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tolak" }));

    await waitFor(() => expect(submitted).toHaveBeenCalledWith("denied"));
    await expect(screen.findByText("Ditolak")).resolves.toBeTruthy();
  });
});
