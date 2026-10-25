import { describe, expect, it, vi } from "vitest";

import {
  resolveActiveOrganizationId,
  toPersonalOrganizationSlug,
} from "./personal-organization";
import type { PersonalOrganizationStore } from "./personal-organization";

const USER_ID = "8d3c1f0e-4b2a-4c55-9e1d-2f6a7b8c9d0e";

const createStore = (
  overrides: Partial<PersonalOrganizationStore> = {}
): PersonalOrganizationStore => ({
  createPersonalOrganization: vi.fn<
    PersonalOrganizationStore["createPersonalOrganization"]
  >(() => Promise.resolve("org-personal")),
  findFirstOrganizationId: vi.fn<
    PersonalOrganizationStore["findFirstOrganizationId"]
  >(() => Promise.resolve(null)),
  ...overrides,
});

describe(resolveActiveOrganizationId, () => {
  it("returns the first organization the user already belongs to", async () => {
    const store = createStore({
      findFirstOrganizationId: () => Promise.resolve("org-existing"),
    });

    await expect(
      resolveActiveOrganizationId({ store, userId: USER_ID })
    ).resolves.toBe("org-existing");
    expect(store.createPersonalOrganization).not.toHaveBeenCalled();
  });

  it("creates a personal organization for a user without one", async () => {
    const store = createStore();

    await expect(
      resolveActiveOrganizationId({ store, userId: USER_ID })
    ).resolves.toBe("org-personal");
    expect(store.createPersonalOrganization).toHaveBeenCalledWith(USER_ID);
  });

  it("uses the organization created by a concurrent login", async () => {
    const findFirstOrganizationId = vi
      .fn<PersonalOrganizationStore["findFirstOrganizationId"]>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("org-concurrent");
    const store = createStore({
      createPersonalOrganization: () =>
        Promise.reject(new Error("duplicate key value violates unique")),
      findFirstOrganizationId,
    });

    await expect(
      resolveActiveOrganizationId({ store, userId: USER_ID })
    ).resolves.toBe("org-concurrent");
  });

  it("rethrows when creation fails and no organization exists", async () => {
    const failure = new Error("database unavailable");
    const store = createStore({
      createPersonalOrganization: () => Promise.reject(failure),
    });

    await expect(
      resolveActiveOrganizationId({ store, userId: USER_ID })
    ).rejects.toBe(failure);
  });
});

describe(toPersonalOrganizationSlug, () => {
  it("derives a unique slug from the user id", () => {
    expect(toPersonalOrganizationSlug(USER_ID)).toBe(`personal-${USER_ID}`);
  });
});
