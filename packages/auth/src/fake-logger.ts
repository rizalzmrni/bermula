import type { Logger } from "@bermula/observability/logger";
import { vi } from "vitest";

/** Logger tiruan untuk test: setiap level berupa mock, tanpa output console. */
export const createFakeLogger = (): Logger => {
  const logger: Logger = {
    child: () => logger,
    debug: vi.fn<Logger["debug"]>(),
    error: vi.fn<Logger["error"]>(),
    flush: () => Promise.resolve(),
    info: vi.fn<Logger["info"]>(),
    warn: vi.fn<Logger["warn"]>(),
  };
  return logger;
};
