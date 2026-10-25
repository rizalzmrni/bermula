import type { LogTransport } from "./logger";

// BetterStack membalas 202 bila log diterima.
const ACCEPTED_STATUS = 202;

export interface BetterStackTransportOptions {
  /** Source token dari BetterStack Telemetry (secret). */
  sourceToken: string;
  /** Ingesting host milik source, mis. `https://s1234.eu-nbg-2.betterstackdata.com`. */
  ingestingUrl: string;
  /** Disuntikkan agar bisa di-stub saat test. */
  fetch?: typeof fetch;
}

/** Transport log ke BetterStack lewat HTTP API (satu request per flush). */
export const createBetterStackTransport =
  ({
    sourceToken,
    ingestingUrl,
    fetch: fetchFn = fetch,
  }: BetterStackTransportOptions): LogTransport =>
  async (entries) => {
    const response = await fetchFn(ingestingUrl, {
      body: JSON.stringify(entries),
      headers: {
        Authorization: `Bearer ${sourceToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (response.status !== ACCEPTED_STATUS) {
      throw new Error(
        `BetterStack rejected logs with status ${response.status}`
      );
    }
  };
