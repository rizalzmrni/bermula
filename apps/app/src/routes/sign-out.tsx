import { redirect } from "react-router";

import { signOut } from "../features/auth/auth-api.server";
import { getSetCookieHeaders } from "../lib/api-client";
import { getCloudflare } from "../lib/cloudflare";
import type { Route } from "./+types/sign-out";

// Keluar hanya lewat POST (mencegah logout via tautan/gambar pihak ketiga).
export const loader = () => redirect("/");

export const action = async ({ request, context }: Route.ActionArgs) => {
  const response = await signOut({
    api: getCloudflare(context).env.API,
    request,
  });
  // Walau api gagal, tetap ke halaman login; cookie penghapus sesi ikut bila ada.
  return redirect("/sign-in", { headers: getSetCookieHeaders(response) });
};
