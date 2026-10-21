import { serializeError } from "./serialize-error";
import type { SerializedError } from "./serialize-error";

const CAPTURE_PATH = "/i/v0/e/";

// Baris stack V8 (Workers & Chromium): "at fn (file:1:2)" atau "at file:1:2".
const STACK_LINE =
  /^\s*at (?:(?<fn>.+?) \()?(?<file>[^()]+):(?<line>\d+):(?<col>\d+)\)?$/u;
const ANONYMOUS_FUNCTION = "<anonymous>";
const NODE_MODULES = "node_modules";

export interface ExceptionFrame {
  platform: "custom";
  lang: "javascript";
  function: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  in_app: boolean;
}

export interface ExceptionItem {
  type: string;
  value: string;
  mechanism: { handled: boolean; synthetic: boolean };
  stacktrace: { type: "raw"; frames: ExceptionFrame[] };
}

export interface CaptureExceptionOptions {
  /** ID pengguna dari sesi. Tanpa ini, event tidak membuat profil person. */
  distinctId?: string;
  /** `false` untuk error yang tertangkap handler global (tidak ditangani kode). */
  handled?: boolean;
  properties?: Record<string, unknown>;
}

export interface PostHogExceptionCaptureOptions {
  /** Project token PostHog (`phc_...`). */
  projectToken: string;
  /** Host ingestion, mis. `https://us.i.posthog.com` atau `https://eu.i.posthog.com`. */
  host: string;
  /** Dipakai sebagai `distinct_id` bila tidak ada pengguna, mis. `api`. */
  service: string;
  fetch?: typeof fetch;
  now?: () => Date;
}

const parseStackLine = (line: string): ExceptionFrame | undefined => {
  const groups = STACK_LINE.exec(line)?.groups;

  if (!(groups?.file && groups.line && groups.col)) {
    return undefined;
  }

  return {
    colno: Number(groups.col),
    filename: groups.file,
    function: groups.fn ?? ANONYMOUS_FUNCTION,
    in_app: !groups.file.includes(NODE_MODULES),
    lang: "javascript",
    lineno: Number(groups.line),
    platform: "custom",
  };
};

/**
 * Stack V8 dimulai dari frame terdalam; frame dibalik agar urutannya dari
 * pemanggil terluar ke titik error, seperti format yang dikirim SDK PostHog.
 */
export const parseStackFrames = (stack?: string): ExceptionFrame[] =>
  (stack ?? "")
    .split("\n")
    .map(parseStackLine)
    .filter((frame): frame is ExceptionFrame => frame !== undefined)
    .toReversed();

/** Error + rantai `cause`-nya, dari error terluar ke penyebab terdalam. */
export const toExceptionList = (
  error: unknown,
  handled: boolean
): ExceptionItem[] => {
  const items: ExceptionItem[] = [];
  let current: SerializedError | undefined = serializeError(error);

  while (current) {
    items.push({
      mechanism: { handled, synthetic: current.name === "NonError" },
      stacktrace: { frames: parseStackFrames(current.stack), type: "raw" },
      type: current.name,
      value: current.message,
    });
    current = current.cause;
  }

  return items;
};

/**
 * Kirim error ke PostHog Error Tracking lewat HTTP capture API (tanpa SDK,
 * sesuai keputusan arsitektur). Di Workers, bungkus dengan `waitUntil`.
 */
export const createPostHogExceptionCapture =
  ({
    projectToken,
    host,
    service,
    fetch: fetchFn = fetch,
    now = () => new Date(),
  }: PostHogExceptionCaptureOptions) =>
  async (
    error: unknown,
    {
      distinctId,
      handled = true,
      properties = {},
    }: CaptureExceptionOptions = {}
  ): Promise<void> => {
    const response = await fetchFn(`${host}${CAPTURE_PATH}`, {
      body: JSON.stringify({
        event: "$exception",
        properties: {
          ...properties,
          $exception_list: toExceptionList(error, handled),
          // Error tanpa pengguna login tidak perlu membuat profil person baru.
          $process_person_profile: distinctId !== undefined,
          distinct_id: distinctId ?? service,
          service,
        },
        timestamp: now().toISOString(),
        token: projectToken,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `PostHog rejected exception with status ${response.status}`
      );
    }
  };

export type CaptureException = ReturnType<typeof createPostHogExceptionCapture>;
