import { describe, expect, it } from "vitest";

import {
  CLEANUP_GRACE_MS,
  CLEANUP_PREFIXES,
  cleanupCutoff,
  findOrphanObjects,
} from "./storage-cleanup";

const NOW = new Date("2026-10-25T20:00:00.000Z");
const CUTOFF = cleanupCutoff(NOW);

const listed = (key: string, uploadedAt: Date) => ({
  key,
  size: 1,
  uploadedAt,
});

describe(cleanupCutoff, () => {
  it("is one grace period before now", () => {
    expect(CUTOFF).toStrictEqual(new Date("2026-10-24T20:00:00.000Z"));
    expect(NOW.getTime() - CUTOFF.getTime()).toBe(CLEANUP_GRACE_MS);
  });
});

describe("storage cleanup scope", () => {
  it("only covers the upload prefixes", () => {
    expect(CLEANUP_PREFIXES).toStrictEqual(["documents/", "images/"]);
  });
});

describe(findOrphanObjects, () => {
  const old = new Date(CUTOFF.getTime() - 1);

  it("returns old objects that have no metadata row", () => {
    const orphan = listed("images/org-deleted/a.png", old);

    expect(
      findOrphanObjects({
        cutoff: CUTOFF,
        knownKeys: new Set(["images/org-1/b.png"]),
        objects: [orphan, listed("images/org-1/b.png", old)],
      })
    ).toStrictEqual([orphan]);
  });

  it("keeps objects younger than the grace period, even without a row", () => {
    expect(
      findOrphanObjects({
        cutoff: CUTOFF,
        knownKeys: new Set(),
        objects: [listed("images/org-1/in-flight.png", CUTOFF)],
      })
    ).toStrictEqual([]);
  });
});
