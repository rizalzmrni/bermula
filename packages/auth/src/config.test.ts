import { describe, expect, it } from "vitest";

import {
  buildCrossSubDomainCookies,
  buildInvitationUrl,
  buildSocialProviders,
  buildTrustedOrigins,
  toAuthLogger,
} from "./config";
import { createFakeLogger } from "./fake-logger";

describe(buildTrustedOrigins, () => {
  it("merges app, web and CORS origins without duplicates", () => {
    expect(
      buildTrustedOrigins({
        APP_URL: "http://localhost:5173",
        CORS_ORIGINS: ["http://localhost:5173", "http://localhost:6006"],
        WEB_URL: "http://localhost:5174",
      })
    ).toStrictEqual([
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:6006",
    ]);
  });
});

describe(buildInvitationUrl, () => {
  it("points to the accept-invitation route and encodes the id", () => {
    expect(
      buildInvitationUrl({
        appUrl: "http://localhost:5173",
        invitationId: "abc/123",
      })
    ).toBe("http://localhost:5173/accept-invitation/abc%2F123");
  });
});

describe(buildSocialProviders, () => {
  it("returns no provider when Google credentials are missing", () => {
    expect(buildSocialProviders({})).toStrictEqual({});
  });

  it("enables Google when both credentials are set", () => {
    const providers = buildSocialProviders({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
    });

    expect(providers.google).toMatchObject({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
  });
});

describe(buildCrossSubDomainCookies, () => {
  it("is disabled without a cookie domain", () => {
    expect(buildCrossSubDomainCookies({})).toBeUndefined();
  });

  it("uses the configured parent domain", () => {
    expect(
      buildCrossSubDomainCookies({ AUTH_COOKIE_DOMAIN: "example.com" })
    ).toStrictEqual({ domain: "example.com", enabled: true });
  });
});

describe(toAuthLogger, () => {
  it("forwards messages and extra arguments to the project logger", () => {
    const logger = createFakeLogger();

    toAuthLogger(logger).log?.("warn", "Something happened", { id: 1 });
    toAuthLogger(logger).log?.("info", "Plain message");

    expect(logger.warn).toHaveBeenCalledWith("Something happened", {
      args: [{ id: 1 }],
    });
    expect(logger.info).toHaveBeenCalledWith("Plain message", undefined);
  });
});
