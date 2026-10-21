import { describe, expect, it, vi } from "vitest";

import { createBetterStackTransport } from "./better-stack";
import type { LogEntry } from "./logger";

const ENTRY: LogEntry = {
  dt: "2026-10-21T12:00:00.000Z",
  level: "info",
  message: "hello",
  service: "api",
};

const INGESTING_URL = "https://s1.eu-nbg-2.betterstackdata.com";

const fetchReturning = (status: number) =>
  vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status })));

describe(createBetterStackTransport, () => {
  it("posts entries as a JSON array with the bearer token", async () => {
    const fetch = fetchReturning(202);
    const transport = createBetterStackTransport({
      fetch,
      ingestingUrl: INGESTING_URL,
      sourceToken: "token_123",
    });

    await transport([ENTRY]);

    expect(fetch).toHaveBeenCalledWith(INGESTING_URL, {
      body: JSON.stringify([ENTRY]),
      headers: {
        Authorization: "Bearer token_123",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("throws when BetterStack does not accept the logs", async () => {
    const transport = createBetterStackTransport({
      fetch: fetchReturning(403),
      ingestingUrl: INGESTING_URL,
      sourceToken: "wrong",
    });

    await expect(transport([ENTRY])).rejects.toThrow("status 403");
  });
});
