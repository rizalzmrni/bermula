import { formatDate } from "@bermula/core/format";
import {
  PAID_PLANS,
  PLAN,
  formatPlanPrice,
  getPlan,
} from "@bermula/core/plans";
import type { PaidPlanId } from "@bermula/core/plans";
import { ErrorState } from "@bermula/design-system/components/feedback/error-state";
import {
  LoadingSkeleton,
  SKELETON_VARIANT,
} from "@bermula/design-system/components/feedback/loading-skeleton";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@bermula/design-system/components/ui/alert";
import { Badge } from "@bermula/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import {
  IconCheck,
  IconCircleCheck,
  IconExternalLink,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useFetcher } from "react-router";

import { FormErrorAlert } from "../auth/form-error-alert";
import { getSubscriptionStatusLabel } from "./labels";
import { useBillingOverview } from "./queries";
import type { BillingOverview } from "./queries";
import { BILLING_INTENT, CHECKOUT_RESULT } from "./schemas";
import type { CheckoutResult } from "./schemas";

/** Hasil action bila gagal; bila berhasil, action me-redirect ke Stripe. */
export interface BillingActionResult {
  formError: string;
}

const PeriodNote = ({
  subscription,
}: {
  subscription: NonNullable<BillingOverview["subscription"]>;
}) => {
  if (!subscription.currentPeriodEnd) {
    return null;
  }
  const date = formatDate(new Date(subscription.currentPeriodEnd));
  return (
    <p className="text-muted-foreground text-sm">
      {subscription.cancelAtPeriodEnd
        ? `Langganan berakhir pada ${date}.`
        : `Diperpanjang otomatis pada ${date}.`}
    </p>
  );
};

const PortalForm = () => {
  const fetcher = useFetcher<BillingActionResult>({ key: "billing-portal" });

  return (
    <fetcher.Form className="flex flex-col gap-3" method="post">
      <FormErrorAlert message={fetcher.data?.formError} />
      <input name="intent" type="hidden" value={BILLING_INTENT.portal} />
      <SubmitButton
        className="w-full sm:w-fit"
        pending={fetcher.state !== "idle"}
        pendingLabel="Membuka portal..."
        variant="outline"
      >
        <IconExternalLink aria-hidden="true" />
        Kelola tagihan
      </SubmitButton>
    </fetcher.Form>
  );
};

const CurrentPlanCard = ({ overview }: { overview: BillingOverview }) => {
  const plan = getPlan(overview.plan);
  const { subscription } = overview;
  const status = subscription
    ? getSubscriptionStatusLabel(subscription.status)
    : null;
  const showPortal =
    overview.billingEnabled && overview.canManage && overview.hasBillingAccount;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Paket saat ini</CardDescription>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
          {plan.name}
          {status ? (
            <Badge variant={status.variant}>{status.label}</Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm">
          {formatPlanPrice(plan.monthlyPrice)}
          {plan.monthlyPrice > 0 ? " / bulan" : null}
        </p>
        {subscription ? <PeriodNote subscription={subscription} /> : null}
      </CardContent>
      {showPortal ? (
        <CardFooter className="flex-col items-stretch gap-2 sm:items-start">
          <p className="text-muted-foreground text-sm">
            Ganti paket, perbarui metode pembayaran, unduh faktur, atau batalkan
            langganan di portal Stripe.
          </p>
          <PortalForm />
        </CardFooter>
      ) : null}
    </Card>
  );
};

const PlanOption = ({ planId }: { planId: PaidPlanId }) => {
  const plan = getPlan(planId);
  const fetcher = useFetcher<BillingActionResult>({
    key: `billing-checkout-${planId}`,
  });

  return (
    <Card className={plan.highlighted ? "ring-primary ring-2" : undefined}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-2xl font-semibold tracking-tight">
          {formatPlanPrice(plan.monthlyPrice)}
          <span className="text-muted-foreground text-sm font-normal">
            {" "}
            / bulan
          </span>
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {plan.features.map((feature) => (
            <li className="flex items-start gap-2" key={feature}>
              <IconCheck
                aria-hidden="true"
                className="text-primary mt-0.5 size-4 shrink-0"
              />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <fetcher.Form className="flex w-full flex-col gap-3" method="post">
          <FormErrorAlert message={fetcher.data?.formError} />
          <input name="intent" type="hidden" value={BILLING_INTENT.checkout} />
          <input name="plan" type="hidden" value={planId} />
          <SubmitButton
            className="w-full"
            pending={fetcher.state !== "idle"}
            pendingLabel="Mengarahkan ke pembayaran..."
            variant={plan.highlighted ? "default" : "outline"}
          >
            Pilih {plan.name}
          </SubmitButton>
        </fetcher.Form>
      </CardFooter>
    </Card>
  );
};

const CheckoutNotice = ({
  checkoutResult,
  plan,
}: {
  checkoutResult: CheckoutResult | null;
  plan: BillingOverview["plan"];
}) => {
  if (checkoutResult === CHECKOUT_RESULT.cancel) {
    return (
      <Alert>
        <IconInfoCircle aria-hidden="true" />
        <AlertDescription>
          Pembayaran dibatalkan. Anda belum ditagih.
        </AlertDescription>
      </Alert>
    );
  }
  if (checkoutResult !== CHECKOUT_RESULT.success) {
    return null;
  }
  return (
    <Alert>
      <IconCircleCheck aria-hidden="true" />
      <AlertTitle>Pembayaran diterima</AlertTitle>
      <AlertDescription>
        {plan === PLAN.free
          ? "Langganan sedang diaktifkan; halaman ini diperbarui otomatis dalam beberapa detik."
          : `Paket ${getPlan(plan).name} sudah aktif. Terima kasih!`}
      </AlertDescription>
    </Alert>
  );
};

const BillingContent = ({ overview }: { overview: BillingOverview }) => {
  const canChoosePlan =
    overview.billingEnabled &&
    overview.canManage &&
    overview.plan === PLAN.free;

  return (
    <>
      <CurrentPlanCard overview={overview} />
      {overview.billingEnabled ? null : (
        <Alert>
          <IconInfoCircle aria-hidden="true" />
          <AlertDescription>
            Pembayaran belum diaktifkan di server ini.
          </AlertDescription>
        </Alert>
      )}
      {overview.billingEnabled && !overview.canManage ? (
        <p className="text-muted-foreground text-sm">
          Hanya owner atau admin organisasi yang dapat mengubah paket.
        </p>
      ) : null}
      {canChoosePlan ? (
        <section
          aria-labelledby="billing-plans"
          className="flex flex-col gap-3"
        >
          <h2 className="text-lg font-semibold" id="billing-plans">
            Tingkatkan paket
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PAID_PLANS.map((planId) => (
              <PlanOption key={planId} planId={planId} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
};

/** Paket organisasi aktif + aksi Checkout/Portal, dengan state loading & error. */
export const BillingSection = ({
  checkoutResult,
}: {
  checkoutResult: CheckoutResult | null;
}) => {
  const query = useBillingOverview({
    awaitingPayment: checkoutResult === CHECKOUT_RESULT.success,
  });

  if (query.isPending) {
    return <LoadingSkeleton rows={2} variant={SKELETON_VARIANT.cards} />;
  }
  if (query.isError) {
    return (
      <ErrorState
        description="Data tagihan tidak dapat dimuat. Silakan coba lagi."
        onRetry={() => query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CheckoutNotice checkoutResult={checkoutResult} plan={query.data.plan} />
      <BillingContent overview={query.data} />
    </div>
  );
};
