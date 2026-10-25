import { formatPlanPrice, PLANS } from "@bermula/core/plans";
import type { PlanDefinition } from "@bermula/core/plans";
import { Badge } from "@bermula/design-system/components/ui/badge";
import { buttonVariants } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "cn";

import { APP_PATHS } from "../../lib/paths";
import { appLink } from "../../lib/site";

const PlanCard = ({ plan }: { plan: PlanDefinition }) => (
  <Card className={cn("h-full", plan.highlighted && "ring-primary ring-2")}>
    <CardHeader>
      <div className="flex items-center justify-between gap-2">
        <CardTitle>
          <h2 className="text-lg">{plan.name}</h2>
        </CardTitle>
        {plan.highlighted ? <Badge>Paling populer</Badge> : null}
      </div>
      <CardDescription>{plan.description}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col gap-6">
      <p className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">
          {formatPlanPrice(plan.monthlyPrice)}
        </span>
        {plan.monthlyPrice > 0 ? (
          <span className="text-muted-foreground text-sm">/bulan</span>
        ) : null}
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
      <a
        className={cn(
          buttonVariants({
            variant: plan.highlighted ? "default" : "outline",
          }),
          "w-full"
        )}
        href={appLink(APP_PATHS.signUp)}
      >
        {plan.monthlyPrice === 0 ? "Mulai gratis" : `Pilih ${plan.name}`}
      </a>
    </CardFooter>
  </Card>
);

export const PricingPlans = () => (
  <ul className="grid gap-4 md:grid-cols-3">
    {PLANS.map((plan) => (
      <li key={plan.id}>
        <PlanCard plan={plan} />
      </li>
    ))}
  </ul>
);
