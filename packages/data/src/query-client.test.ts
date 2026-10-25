import { describe, expect, it } from "vitest";

import {
  createQueryClient,
  DEFAULT_STALE_TIME,
  HttpError,
  shouldRetry,
} from "./query-client";

describe(shouldRetry, () => {
  it.each([401, 403, 404, 429])("does not retry HTTP %i", (status) => {
    expect(shouldRetry(0, new HttpError(status))).toBeFalsy();
  });

  it("retries server and network errors twice", () => {
    expect(shouldRetry(0, new HttpError(503))).toBeTruthy();
    expect(shouldRetry(1, new TypeError("fetch failed"))).toBeTruthy();
    expect(shouldRetry(2, new HttpError(503))).toBeFalsy();
  });
});

describe(createQueryClient, () => {
  it("keeps SSR data fresh after hydration", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(
      DEFAULT_STALE_TIME
    );
  });

  it("creates an isolated cache every time", () => {
    const first = createQueryClient();
    first.setQueryData(["account"], { id: "a" });
    expect(createQueryClient().getQueryData(["account"])).toBeUndefined();
  });
});
