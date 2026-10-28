import {
  isOrganizationManager,
  isOrganizationOwner,
} from "@bermula/core/organizations";
import { ConfirmDialog } from "@bermula/design-system/components/feedback/confirm-dialog";
import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import { Button } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import { useFetcher } from "react-router";

import { FormErrorAlert } from "../auth/form-error-alert";
import { OrganizationForm } from "./organization-form";
import type { Organization } from "./queries";
import { SETTINGS_INTENT, isActionError } from "./schemas";
import type { OrganizationActionResult, SettingsIntent } from "./schemas";

type SettingsActionResult = OrganizationActionResult<SettingsIntent>;

const errorFor = (
  result: SettingsActionResult | undefined,
  intents: readonly SettingsIntent[]
) =>
  isActionError(result) &&
  (result.intent === null || intents.includes(result.intent))
    ? result.formError
    : undefined;

/** Nama dan alamat organisasi; anggota biasa hanya melihat. */
export const OrganizationProfileCard = ({
  organization,
}: {
  organization: Organization;
}) => {
  const fetcher = useFetcher<SettingsActionResult>({
    key: "organization-profile",
  });
  const canEdit = isOrganizationManager(organization.role);
  const saved = fetcher.data !== undefined && "success" in fetcher.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Profil organisasi</h2>
        </CardTitle>
        <CardDescription>
          Mengubah alamat juga mengubah tautan dashboard; tautan lama tidak
          berlaku lagi.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canEdit ? null : (
          <Alert>
            <IconInfoCircle aria-hidden="true" />
            <AlertDescription>
              Hanya pemilik atau admin yang bisa mengubah profil.
            </AlertDescription>
          </Alert>
        )}
        {saved ? (
          <Alert>
            <IconCircleCheck aria-hidden="true" />
            <AlertDescription>Perubahan disimpan.</AlertDescription>
          </Alert>
        ) : null}
        <OrganizationForm
          defaultValues={{ name: organization.name, slug: organization.slug }}
          disabled={!canEdit}
          formError={errorFor(fetcher.data, [SETTINGS_INTENT.update])}
          // Form baru setelah tersimpan agar nilai awal mengikuti data terbaru.
          key={`${organization.name}/${organization.slug}`}
          render={<fetcher.Form method="post" />}
          submit={(element) => fetcher.submit(element)}
          submitLabel="Simpan perubahan"
        >
          <input name="intent" type="hidden" value={SETTINGS_INTENT.update} />
        </OrganizationForm>
      </CardContent>
    </Card>
  );
};

/**
 * Keluar (semua anggota kecuali pemilik tunggal) dan hapus (pemilik). Hasil
 * berhasil me-redirect ke dashboard pribadi; error tampil di kartu ini.
 */
export const OrganizationDangerZone = ({
  organization,
}: {
  organization: Organization;
}) => {
  const fetcher = useFetcher<SettingsActionResult>({
    key: "organization-danger",
  });
  const isOwner = isOrganizationOwner(organization.role);
  const submitIntent = (intent: SettingsIntent) =>
    fetcher.submit({ intent }, { method: "post" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Zona berbahaya</h2>
        </CardTitle>
        <CardDescription>
          Tindakan di bawah tidak bisa dibatalkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormErrorAlert
          message={errorFor(fetcher.data, [
            SETTINGS_INTENT.leave,
            SETTINGS_INTENT.delete,
          ])}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-muted-foreground flex-1 text-sm">
            Keluar dari organisasi. Anda perlu diundang lagi untuk kembali.
          </p>
          <ConfirmDialog
            confirmLabel="Keluar"
            description={`Anda tidak bisa lagi membuka ${organization.name}.`}
            destructive
            onConfirm={() => submitIntent(SETTINGS_INTENT.leave)}
            title={`Keluar dari ${organization.name}?`}
            trigger={
              <Button className="w-full sm:w-fit" variant="outline">
                Keluar dari organisasi
              </Button>
            }
          />
        </div>
        {isOwner ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-muted-foreground flex-1 text-sm">
              Hapus organisasi beserta anggota, undangan, dan semua datanya.
            </p>
            <ConfirmDialog
              confirmLabel="Hapus permanen"
              description={`${organization.name} dan semua datanya dihapus permanen untuk semua anggota.`}
              destructive
              onConfirm={() => submitIntent(SETTINGS_INTENT.delete)}
              title={`Hapus ${organization.name}?`}
              trigger={
                <Button className="w-full sm:w-fit" variant="destructive">
                  Hapus organisasi
                </Button>
              }
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
