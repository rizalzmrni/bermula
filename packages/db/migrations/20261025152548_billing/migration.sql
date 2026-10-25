CREATE TABLE "billing_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"stripe_customer_id" text NOT NULL UNIQUE,
	"organization_id" uuid NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"stripe_subscription_id" text NOT NULL UNIQUE,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_plan_check" CHECK ("plan" in ('pro', 'business'))
);
--> statement-breakpoint
CREATE TABLE "billing_webhook_events" (
	"id" text PRIMARY KEY,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "billing_subscriptions_organization_id_idx" ON "billing_subscriptions" ("organization_id");--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_organization_id_auth_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth_organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_Et9fOnemdrU2_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth_organizations"("id") ON DELETE CASCADE;