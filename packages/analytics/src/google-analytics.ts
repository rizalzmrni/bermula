// Google Analytics 4 lewat gtag.js resmi, tanpa library pembungkus. Hanya
// dipanggil di browser, setelah pengunjung menyetujui cookie analitik.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SCRIPT_ID = "google-analytics";
const GTAG_URL = "https://www.googletagmanager.com/gtag/js";

/** Flag opt-out resmi GA: `window['ga-disable-<ID>'] = true` menghentikan pengiriman. */
const setDisabled = (measurementId: string, disabled: boolean) => {
  Reflect.set(window, `ga-disable-${measurementId}`, disabled);
};

// gtag.js hanya memproses objek `arguments` di dataLayer, bukan array biasa;
// ini salinan snippet resmi Google.
// `function` (bukan arrow) karena arrow function tidak punya `arguments`.
const gtag = function gtag() {
  // oxlint-disable-next-line prefer-rest-params -- gtag.js butuh objek `arguments`.
  window.dataLayer?.push(arguments);
};

/**
 * Memuat gtag.js sekali. `send_page_view: false` karena page view dikirim
 * manual tiap navigasi client-side (`trackGoogleAnalyticsPageView`).
 */
export const loadGoogleAnalytics = (measurementId: string) => {
  setDisabled(measurementId, false);
  if (document.querySelector(`#${SCRIPT_ID}`)) {
    return;
  }

  window.dataLayer ??= [];
  window.gtag = gtag;
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.id = SCRIPT_ID;
  script.src = `${GTAG_URL}?id=${encodeURIComponent(measurementId)}`;
  // Bukan `append`: di app, tipe Workers (`Element` milik HTMLRewriter)
  // menimpa signature DOM-nya; `appendChild` (dari `Node`) tidak terdampak.
  // oxlint-disable-next-line prefer-dom-node-append -- lihat komentar di atas.
  document.head.appendChild(script);
};

/** `page`: path + query halaman, mis. `/harga?ref=x`. */
export const trackGoogleAnalyticsPageView = (page: string) => {
  window.gtag?.("event", "page_view", {
    page_location: new URL(page, window.location.origin).href,
    page_title: document.title,
  });
};

/** Persetujuan dicabut: script yang sudah dimuat tetap ada, tetapi berhenti mengirim. */
export const disableGoogleAnalytics = (measurementId: string) => {
  setDisabled(measurementId, true);
};
