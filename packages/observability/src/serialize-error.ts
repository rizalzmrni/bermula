export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
}

// Batas kedalaman `cause` agar rantai error yang melingkar tidak membuat loop.
const MAX_CAUSE_DEPTH = 5;

/** Ubah nilai apa pun yang di-`throw` menjadi objek JSON-safe. */
export const serializeError = (value: unknown, depth = 0): SerializedError => {
  if (!(value instanceof Error)) {
    return { message: String(value), name: "NonError" };
  }

  const serialized: SerializedError = {
    message: value.message,
    name: value.name,
  };

  if (value.stack) {
    serialized.stack = value.stack;
  }

  if (value.cause !== undefined && depth < MAX_CAUSE_DEPTH) {
    serialized.cause = serializeError(value.cause, depth + 1);
  }

  return serialized;
};
