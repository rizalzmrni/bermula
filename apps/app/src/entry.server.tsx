import { createLogger } from "@bermula/observability/logger";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { EntryContext } from "react-router";

/**
 * Render streaming di Worker. Tanpa deteksi bot (`isbot`): apps/app adalah
 * area login yang tidak diindeks mesin pencari, jadi shell selalu dikirim
 * secepatnya. Hanya mode SPA yang menunggu seluruh konten.
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
        // dicatat React Router; di sini hanya error saat streaming.
        if (shellRendered) {
          createLogger({ service: "app" }).error("stream render failed", {
            error: error instanceof Error ? error.message : String(error),
            url: request.url,
          });
        }
      },
      signal: request.signal,
    }
  );
  shellRendered = true;

  if (routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status });
}
