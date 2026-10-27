import { describe, expect, it } from "vitest";

import {
  TEST_WEBHOOK_SECRET as SECRET,
  signWebhookPayload as sign,
} from "./testing";
import { WEBHOOK_VERIFICATION, verifyWebhookEvent } from "./webhook";

const PAYLOAD = JSON.stringify({
  data: { id: "sub_123" },
  timestamp: "2026-10-27T00:00:00Z",
  type: "subscription.updated",
});

// Lebih dari toleransi 5 menit SDK.
const TEN_MINUTES_IN_SECONDS = 600;

describe(verifyWebhookEvent, () => {
  it("returns the event for a valid signature", async () => {
    const verification = await verifyWebhookEvent({
      headers: await sign({ payload: PAYLOAD }),
      payload: PAYLOAD,
      secret: SECRET,
    });

    expect(verification).toMatchObject({
      event: { data: { id: "sub_123" }, type: "subscription.updated" },
      result: WEBHOOK_VERIFICATION.valid,
    });
  });

  it("rejects a tampered payload", async () => {
    const headers = await sign({ payload: PAYLOAD });
    const tampered = PAYLOAD.replace("sub_123", "sub_999");

    await expect(
      verifyWebhookEvent({ headers, payload: tampered, secret: SECRET })
    ).resolves.toStrictEqual({ result: WEBHOOK_VERIFICATION.invalid });
  });

  it("rejects a signature made with another secret", async () => {
    await expect(
      verifyWebhookEvent({
        headers: await sign({
          payload: PAYLOAD,
          secret: "polar_whs_other_secret",
        }),
        payload: PAYLOAD,
        secret: SECRET,
      })
    ).resolves.toStrictEqual({ result: WEBHOOK_VERIFICATION.invalid });
  });

  it("rejects a replayed delivery outside the timestamp tolerance", async () => {
    const headers = await sign({
      payload: PAYLOAD,
      timestamp: Math.floor(Date.now() / 1000) - TEN_MINUTES_IN_SECONDS,
    });

    await expect(
      verifyWebhookEvent({ headers, payload: PAYLOAD, secret: SECRET })
    ).resolves.toStrictEqual({ result: WEBHOOK_VERIFICATION.invalid });
  });

  it("reports a signed event of an unknown type as unsupported", async () => {
    const payload = JSON.stringify({ data: {}, type: "future.event" });

    await expect(
      verifyWebhookEvent({
        headers: await sign({ payload }),
        payload,
        secret: SECRET,
      })
    ).resolves.toStrictEqual({
      eventType: "future.event",
      result: WEBHOOK_VERIFICATION.unsupported,
    });
  });

  it("reports a signed body that is not JSON as malformed", async () => {
    const payload = "not-json";

    await expect(
      verifyWebhookEvent({
        headers: await sign({ payload }),
        payload,
        secret: SECRET,
      })
    ).resolves.toStrictEqual({ result: WEBHOOK_VERIFICATION.malformed });
  });
});
