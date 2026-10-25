import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  // Resource route (tanpa komponen): dilayani sebagai teks/XML, bukan HTML.
  route("sitemap.xml", "routes/sitemap.ts"),
  route("robots.txt", "routes/robots.ts"),
  layout("routes/site-layout.tsx", [
    index("routes/home.tsx"),
    route("harga", "routes/pricing.tsx"),
    route("privasi", "routes/privacy.tsx"),
    route("syarat", "routes/terms.tsx"),
    // Catch-all di dalam layout agar halaman 404 tetap punya header & footer.
    route("*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
