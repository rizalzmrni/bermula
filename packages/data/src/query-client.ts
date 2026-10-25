import { QueryClient } from "@tanstack/react-query";

const SECOND = 1000;

/**
 * Data hasil SSR dianggap segar selama ini, sehingga `useQuery` tidak
 * langsung fetch ulang setelah hydrate.
 */
export const DEFAULT_STALE_TIME = 60 * SECOND;

const MAX_RETRIES = 2;
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_CLIENT_ERROR_MAX = 499;

/** Error query yang membawa status HTTP; dilempar `queryFn` saat respons tidak ok. */
export class HttpError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message = `Request failed with status ${status}`
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const isClientError = (error: unknown) =>
  error instanceof HttpError &&
  error.status >= HTTP_CLIENT_ERROR_MIN &&
  error.status <= HTTP_CLIENT_ERROR_MAX;

/**
 * Hanya error jaringan/5xx yang dicoba ulang. 4xx (401, 403, 404, 429) tidak
 * akan berubah dengan mengulang request yang sama.
 */
export const shouldRetry = (failureCount: number, error: unknown) =>
  !isClientError(error) && failureCount < MAX_RETRIES;

/**
 * QueryClient dengan default proyek. Server membuat satu per request (jangan
 * dibagi antar-request: cache berisi data pengguna); browser satu per tab.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: DEFAULT_STALE_TIME },
    },
  });
