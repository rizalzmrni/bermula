import { HttpError } from "@bermula/data/query-client";
import { data } from "react-router";

import { getQueryClient } from "../../lib/query-client";
import { getServerApiClient } from "../../lib/session.server";
import type { SessionArgs } from "../../lib/session.server";
import { organizationsQueryOptions } from "./queries";
import type { Organization } from "./queries";

const HTTP_NOT_FOUND = 404;

/**
 * Organisasi dari `:slug` untuk loader/action `/o/:slug/*`. Daftar organisasi
 * pengguna diambil sekali per request (QueryClient yang sama dipakai semua
 * loader yang berjalan paralel). Slug yang bukan milik pengguna → 404.
 */
export const requireOrganization = async ({
  slug,
  ...args
}: SessionArgs & { slug: string | undefined }): Promise<Organization> => {
  let organizations: Organization[];
  try {
    organizations = await getQueryClient(args.context).ensureQueryData(
      organizationsQueryOptions(getServerApiClient(args))
    );
  } catch (error) {
    if (error instanceof HttpError) {
      throw data(null, { status: error.status });
    }
    throw error;
  }

  const organization = organizations.find((item) => item.slug === slug);
  if (!organization) {
    throw data(null, { status: HTTP_NOT_FOUND });
  }
  return organization;
};
