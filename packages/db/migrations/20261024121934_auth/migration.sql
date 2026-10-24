CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"is_personal" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"active_organization_id" uuid,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "auth_invitations_organization_id_idx" ON "auth_invitations" ("organization_id");--> statement-breakpoint
CREATE INDEX "auth_invitations_email_idx" ON "auth_invitations" ("email");--> statement-breakpoint
CREATE INDEX "auth_members_user_id_idx" ON "auth_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_members_organization_id_user_id_idx" ON "auth_members" ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" ("identifier");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_organization_id_auth_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth_organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_inviter_id_auth_users_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_organization_id_auth_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth_organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_active_organization_id_auth_organizations_id_fkey" FOREIGN KEY ("active_organization_id") REFERENCES "auth_organizations"("id") ON DELETE SET NULL;