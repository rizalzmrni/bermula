import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "./logger";
import type { LogEntry } from "./logger";

const NOW = new Date("2026-10-21T12:00:00Z");
const now = () => NOW;

const silenceConsole = () => {
  for (const level of ["debug", "info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation(() => {
      // Bungkam output console selama test.
    });
  }
};

const collectingTransport = () => {
  const received: LogEntry[][] = [];
  const transport = (entries: readonly LogEntry[]) => {
    received.push([...entries]);
    return Promise.resolve();
  };
  return { received, transport };
};

const failingTransport = () => Promise.reject(new Error("network down"));

describe(createLogger, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes structured entries to the matching console method", () => {
    silenceConsole();
    const logger = createLogger({ now, service: "api" });

    logger.warn("Slow query", { durationMs: 1200 });

    expect(console.warn).toHaveBeenCalledWith({
      dt: "2026-10-21T12:00:00.000Z",
      durationMs: 1200,
      level: "warn",
      message: "Slow query",
      service: "api",
    });
  });

  it("drops entries below minLevel", () => {
    silenceConsole();
    const logger = createLogger({ minLevel: "warn", now, service: "api" });

    logger.info("ignored");

    expect(console.info).not.toHaveBeenCalled();
  });

  it("serializes Error fields instead of logging an empty object", () => {
    silenceConsole();
    const logger = createLogger({ now, service: "api" });

    logger.error("Failed", { error: new TypeError("boom") });

    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: "boom", name: "TypeError" }),
      })
    );
  });

  it("sends buffered entries from parent and child on flush, once", async () => {
    silenceConsole();
    const { received, transport } = collectingTransport();
    const logger = createLogger({
      now,
      service: "api",
      transports: [transport],
    });
    const child = logger.child({ requestId: "req_1" });

    logger.info("first");
    child.info("second");
    await logger.flush();
    await logger.flush();

    expect(received).toHaveLength(1);
    expect(received[0]?.map((entry) => entry.message)).toStrictEqual([
      "first",
      "second",
    ]);
    expect(received[0]?.[1]).toMatchObject({ requestId: "req_1" });
  });

  it("does not throw when a transport fails", async () => {
    silenceConsole();
    const logger = createLogger({
      now,
      service: "api",
      transports: [failingTransport],
    });

    logger.info("hello");

    await expect(logger.flush()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Log transport failed" })
    );
  });
});
