CREATE TABLE "storage_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" text NOT NULL,
	"key" text NOT NULL UNIQUE,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_files_kind_check" CHECK ("kind" in ('document', 'image')),
	CONSTRAINT "storage_files_status_check" CHECK ("status" in ('pending', 'uploaded')),
	CONSTRAINT "storage_files_size_check" CHECK ("size" > 0)
);
--> statement-breakpoint
CREATE INDEX "storage_files_organization_id_kind_created_at_idx" ON "storage_files" ("organization_id","kind","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "storage_files_uploaded_by_idx" ON "storage_files" ("uploaded_by");--> statement-breakpoint
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_organization_id_auth_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth_organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_uploaded_by_auth_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth_users"("id") ON DELETE SET NULL;