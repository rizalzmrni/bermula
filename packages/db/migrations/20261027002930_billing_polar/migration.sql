CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"polar_subscription_id" text NOT NULL UNIQUE,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"polar_customer_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"polar_modified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_plan_check" CHECK ("plan" in ('pro', 'business'))
);
--> statement-breakpoint
CREATE INDEX "billing_subscriptions_organization_id_idx" ON "billing_subscriptions" ("organization_id");--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_Et9fOnemdrU2_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth_organizations"("id") ON DELETE CASCADE;