import { z } from "zod";

export const HTTP_TOO_MANY_REQUESTS = 429;

export const RATE_LIMITED_MESSAGE =
  "Terlalu banyak percobaan. Coba lagi dalam satu menit.";

const errorBodySchema = z.object({ code: z.string().optional() });

/** `code` error better-auth dari body respons, bila ada. */
export const readErrorCode = async (response: Response) => {
  const body = errorBodySchema.safeParse(
    await response.json().catch(() => null)
  );
  return body.success ? body.data.code : undefined;
};
