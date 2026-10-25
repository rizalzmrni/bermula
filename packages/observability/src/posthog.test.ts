import { describe, expect, it, vi } from "vitest";

import {
  createPostHogExceptionCapture,
  parseStackFrames,
  toExceptionList,
} from "./posthog";

const STACK = [
  "TypeError: boom",
  "    at handler (file:///app/src/routes/users.ts:10:5)",
  "    at async dispatch (file:///app/node_modules/hono/dist/compose.js:22:17)",
  "    at file:///app/src/index.ts:3:1",
].join("\n");

const errorWithStack = (message: string, options?: ErrorOptions) => {
  const error = new TypeError(message, options);
  error.stack = STACK;
  return error;
};

describe(parseStackFrames, () => {
  it("parses V8 frames oldest-first and marks node_modules as not in app", () => {
    expect(parseStackFrames(STACK)).toStrictEqual([
      {
        colno: 1,
        filename: "file:///app/src/index.ts",
        function: "<anonymous>",
        in_app: true,
        lang: "javascript",
        lineno: 3,
        platform: "custom",
      },
      {
        colno: 17,
        filename: "file:///app/node_modules/hono/dist/compose.js",
        function: "async dispatch",
        in_app: false,
        lang: "javascript",
        lineno: 22,
        platform: "custom",
      },
      {
        colno: 5,
        filename: "file:///app/src/routes/users.ts",
        function: "handler",
        in_app: true,
        lang: "javascript",
        lineno: 10,
        platform: "custom",
      },
    ]);
  });

  it("returns no frames for a missing stack", () => {
    expect(parseStackFrames()).toStrictEqual([]);
  });
});

describe(toExceptionList, () => {
  it("includes the cause chain from outer to inner error", () => {
    const error = errorWithStack("outer", { cause: new RangeError("inner") });

    const list = toExceptionList(error, true);

    expect(list.map((item) => [item.type, item.value])).toStrictEqual([
      ["TypeError", "outer"],
      ["RangeError", "inner"],
    ]);
  });

  it("marks thrown non-Error values as synthetic", () => {
    const [item] = toExceptionList("plain string", false);

    expect(item).toMatchObject({
      mechanism: { handled: false, synthetic: true },
      value: "plain string",
    });
  });
});

describe(createPostHogExceptionCapture, () => {
  const NOW = new Date("2026-10-21T12:00:00Z");

  const setup = (status = 200) => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(null, { status }))
    );
    const capture = createPostHogExceptionCapture({
      fetch: fetchMock,
      host: "https://eu.i.posthog.com",
      now: () => NOW,
      projectToken: "phc_test",
      service: "api",
    });
    return { capture, fetchMock };
  };

  const sentBody = (
    fetchMock: ReturnType<typeof setup>["fetchMock"]
  ): unknown => JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

  it("sends a $exception event to the capture endpoint", async () => {
    const { capture, fetchMock } = setup();

    await capture(errorWithStack("boom"), {
      distinctId: "user_1",
      properties: { path: "/users" },
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://eu.i.posthog.com/i/v0/e/"
    );
    expect(sentBody(fetchMock)).toMatchObject({
      event: "$exception",
      properties: {
        $process_person_profile: true,
        distinct_id: "user_1",
        path: "/users",
        service: "api",
      },
      timestamp: "2026-10-21T12:00:00.000Z",
      token: "phc_test",
    });
  });

  it("uses the service as distinct_id without creating a person profile", async () => {
    const { capture, fetchMock } = setup();

    await capture(new Error("anonymous"));

    expect(sentBody(fetchMock)).toMatchObject({
      properties: { $process_person_profile: false, distinct_id: "api" },
    });
  });

  it("throws when PostHog rejects the event", async () => {
    const { capture } = setup(401);

    await expect(capture(new Error("x"))).rejects.toThrow("status 401");
  });
});
