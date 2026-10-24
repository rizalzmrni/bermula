CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp with time zone,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"inviter_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"is_personal" boolean DEFAULT false NOT NULL,
	"logo" text,
	"metadata" text,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "session" (
	"active_organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ip_address" text,
	"token" text NOT NULL UNIQUE,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"image" text,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_id_user_id_idx" ON "member" ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organization_id_fkey" FOREIGN KEY ("active_organization_id") REFERENCES "organization"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;