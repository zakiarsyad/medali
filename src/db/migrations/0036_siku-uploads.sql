CREATE TABLE "siku_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"fingerprint" text NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	CONSTRAINT "siku_uploads_fingerprint_is_sha256" CHECK ("siku_uploads"."fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "siku_adjustments" ADD COLUMN "upload_id" uuid;--> statement-breakpoint
ALTER TABLE "siku_uploads" ADD CONSTRAINT "siku_uploads_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "siku_uploads_fingerprint" ON "siku_uploads" USING btree ("fingerprint");--> statement-breakpoint
ALTER TABLE "siku_adjustments" ADD CONSTRAINT "siku_adjustments_upload_id_siku_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."siku_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "siku_adjustments_upload" ON "siku_adjustments" USING btree ("upload_id");