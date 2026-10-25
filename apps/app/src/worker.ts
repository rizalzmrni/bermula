import { createQueryClient } from "@bermula/data/query-client";
import { createRequestHandler, RouterContextProvider } from "react-router";

import { cloudflareContext } from "./lib/cloudflare";
import { queryClientContext } from "./lib/query-client";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { ctx, env });
    context.set(queryClientContext, createQueryClient());
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
