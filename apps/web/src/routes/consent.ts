import { handleConsentAction } from "@bermula/analytics/consent";
import { redirect } from "react-router";

import type { Route } from "./+types/consent";

// Hanya POST dari banner/halaman pengaturan; dibuka langsung → beranda.
export const loader = () => redirect("/");

export const action = ({ request }: Route.ActionArgs) =>
  handleConsentAction(request);
