import { createLogger } from "@bermula/observability/logger";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { EntryContext } from "react-router";

/**
 * Render di Worker. Berbeda dengan apps/app, respons selalu menunggu
 * `allReady`: halaman marketing statis (tanpa data lambat) sehingga biayanya
 * kecil, dan crawler pasti menerima HTML lengkap tanpa deteksi bot (`isbot`).
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  let status = responseStatusCode;
  let shellRendered = false;

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        status = 500;
        // Error sebelum shell selesai ditolak `renderToReadableStream` dan
        // dicatat React Router; di sini hanya error setelahnya.
        if (shellRendered) {
          createLogger({ service: "web" }).error("stream render failed", {
            error: error instanceof Error ? error.message : String(error),
            url: request.url,
          });
        }
      },
      signal: request.signal,
    }
  );
  shellRendered = true;
  await body.allReady;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status });
}
