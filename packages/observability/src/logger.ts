import { serializeError } from "./serialize-error";

export const LOG_LEVELS = {
  debug: 10,
  error: 40,
  info: 20,
  warn: 30,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export type LogFields = Record<string, unknown>;

export type LogEntry = LogFields & {
  /** Nama field `dt` mengikuti format timestamp BetterStack. */
  dt: string;
  level: LogLevel;
  message: string;
  service: string;
};

/** Tujuan pengiriman log (mis. BetterStack). Dipanggil saat `flush()`. */
export type LogTransport = (entries: readonly LogEntry[]) => Promise<void>;

export interface LoggerOptions {
  service: string;
  minLevel?: LogLevel;
  fields?: LogFields;
  transports?: readonly LogTransport[];
  /** Disuntikkan agar test deterministik. */
  now?: () => Date;
}

export interface Logger {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
  /** Logger turunan dengan field tambahan (mis. `requestId`), berbagi buffer yang sama. */
  child: (fields: LogFields) => Logger;
  /**
   * Kirim log yang tertahan ke semua transport. Di Workers, bungkus dengan
   * `c.executionCtx.waitUntil(logger.flush())` agar tidak menahan respons.
   */
  flush: () => Promise<void>;
}

interface SharedState {
  buffer: LogEntry[];
  minLevel: LogLevel;
  now: () => Date;
  service: string;
  transports: readonly LogTransport[];
}

// Error tidak ter-serialize oleh JSON.stringify (hasilnya `{}`), jadi diubah dulu.
const normalizeFields = (fields: LogFields): LogFields =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      value instanceof Error ? serializeError(value) : value,
    ])
  );

// Workers Logs mengindeks objek yang ditulis ke console, jadi entri dikirim
// sebagai objek, bukan string.
const writeToConsole = (entry: LogEntry) => {
  console[entry.level](entry);
};

const flushState = async (state: SharedState) => {
  if (state.buffer.length === 0 || state.transports.length === 0) {
    state.buffer.length = 0;
    return;
  }

  const entries = state.buffer.splice(0);
  const results = await Promise.allSettled(
    state.transports.map((transport) => transport(entries))
  );

  for (const result of results) {
    // Logger tidak bisa mencatat kegagalannya sendiri lewat transport yang
    // sama, jadi kegagalan transport hanya ditulis ke console.
    if (result.status === "rejected") {
      console.error({
        error: serializeError(result.reason),
        message: "Log transport failed",
        service: state.service,
      });
    }
  }
};

const buildLogger = (state: SharedState, baseFields: LogFields): Logger => {
  const log = (level: LogLevel, message: string, fields: LogFields = {}) => {
    if (LOG_LEVELS[level] < LOG_LEVELS[state.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      ...normalizeFields({ ...baseFields, ...fields }),
      dt: state.now().toISOString(),
      level,
      message,
      service: state.service,
    };

    writeToConsole(entry);
    state.buffer.push(entry);
  };

  return {
    child: (fields) => buildLogger(state, { ...baseFields, ...fields }),
    debug: (message, fields) => log("debug", message, fields),
    error: (message, fields) => log("error", message, fields),
    flush: () => flushState(state),
    info: (message, fields) => log("info", message, fields),
    warn: (message, fields) => log("warn", message, fields),
  };
};

/**
 * Buat logger **per request** di Workers: buffer disimpan di objek logger,
 * bukan di variabel modul yang dibagi antar-request dalam satu isolate.
 */
export const createLogger = ({
  service,
  minLevel = "info",
  fields = {},
  transports = [],
  now = () => new Date(),
}: LoggerOptions): Logger =>
  buildLogger({ buffer: [], minLevel, now, service, transports }, fields);
