import { describe, expect, it } from "vitest";

import {
  TEST_WEBHOOK_SECRET as SECRET,
  signWebhookPayload as sign,
} from "./testing";
import { verifyWebhookEvent } from "./webhook";

const PAYLOAD = JSON.stringify({
  data: { object: { id: "sub_123", object: "subscription" } },
  id: "evt_123",
  object: "event",
  type: "customer.subscription.updated",
});

describe(verifyWebhookEvent, () => {
  it("returns the event for a valid signature", async () => {
    const event = await verifyWebhookEvent({
      payload: PAYLOAD,
      secret: SECRET,
      signature: await sign(PAYLOAD),
    });

    expect(event?.id).toBe("evt_123");
    expect(event?.type).toBe("customer.subscription.updated");
  });

  it("rejects a tampered payload", async () => {
    const signature = await sign(PAYLOAD);
    const tampered = PAYLOAD.replace("sub_123", "sub_999");

    await expect(
      verifyWebhookEvent({ payload: tampered, secret: SECRET, signature })
    ).resolves.toBeNull();
  });

  it("rejects a signature made with another secret", async () => {
    await expect(
      verifyWebhookEvent({
        payload: PAYLOAD,
        secret: SECRET,
        signature: await sign(PAYLOAD, "whsec_other_secret"),
      })
    ).resolves.toBeNull();
  });

  it("rejects a malformed signature header", async () => {
    await expect(
      verifyWebhookEvent({
        payload: PAYLOAD,
        secret: SECRET,
        signature: "not-a-signature",
      })
    ).resolves.toBeNull();
  });
});
