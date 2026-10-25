import { createRequestHandler, RouterContextProvider } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  // Situs ini belum butuh env/binding server di loader; bila nanti perlu,
  // isi context seperti `cloudflareContext` di apps/app.
  fetch: (request) => requestHandler(request, new RouterContextProvider()),
} satisfies ExportedHandler<Env>;
