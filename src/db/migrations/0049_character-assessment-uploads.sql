CREATE TABLE "character_assessment_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"fingerprint" text NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	CONSTRAINT "character_assessment_uploads_fingerprint_is_sha256" CHECK ("character_assessment_uploads"."fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "character_assessments" ADD COLUMN "upload_id" uuid;--> statement-breakpoint
ALTER TABLE "character_assessment_uploads" ADD CONSTRAINT "character_assessment_uploads_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_assessments" ADD CONSTRAINT "character_assessments_upload_id_character_assessment_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."character_assessment_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_assessments_upload" ON "character_assessments" USING btree ("upload_id");--> statement-breakpoint
-- Added by hand. An upload names the file its assessments came from, and
-- those assessments can never be changed or deleted. So the upload is
-- refused the same, by the function that guards the assessments.
CREATE TRIGGER character_assessment_uploads_cannot_change
BEFORE UPDATE OR DELETE ON character_assessment_uploads
FOR EACH ROW EXECUTE FUNCTION refuse_character_assessment_edit();--> statement-breakpoint
CREATE TRIGGER character_assessment_uploads_cannot_be_emptied
BEFORE TRUNCATE ON character_assessment_uploads
FOR EACH STATEMENT EXECUTE FUNCTION refuse_character_assessment_edit();
