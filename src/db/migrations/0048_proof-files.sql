CREATE TABLE "proof_file_keeping" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"keep_days" smallint NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	"set_by" uuid NOT NULL,
	CONSTRAINT "proof_file_keeping_one_row" CHECK ("proof_file_keeping"."id" = 1),
	CONSTRAINT "proof_file_keeping_days_in_range" CHECK ("proof_file_keeping"."keep_days" between 30 and 3650)
);
--> statement-breakpoint
CREATE TABLE "proof_file_removals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"removed_by" uuid NOT NULL,
	"removed_at" timestamp with time zone NOT NULL,
	"keep_days" smallint NOT NULL,
	"attendance_photos" integer NOT NULL,
	"siku_photos" integer NOT NULL,
	"return_photos" integer NOT NULL,
	"activity_clarification_files" integer NOT NULL,
	"dorm_clarification_files" integer NOT NULL,
	"appeal_proofs" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_attendances" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activity_clarifications" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_clarifications" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_return_reports" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_violation_appeals" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "siku_request_photos" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proof_file_keeping" ADD CONSTRAINT "proof_file_keeping_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_file_removals" ADD CONSTRAINT "proof_file_removals_removed_by_accounts_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Added by hand. The log of removed proof files is a record that must
-- always be trusted, so the database itself refuses to change or delete
-- a line of it. Row triggers do not see TRUNCATE, which would empty the
-- log in one statement, so that has a trigger of its own.
CREATE FUNCTION refuse_proof_file_removal_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of removed proof files cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER proof_file_removals_cannot_change
BEFORE UPDATE OR DELETE ON proof_file_removals
FOR EACH ROW EXECUTE FUNCTION refuse_proof_file_removal_edit();--> statement-breakpoint
CREATE TRIGGER proof_file_removals_cannot_be_emptied
BEFORE TRUNCATE ON proof_file_removals
FOR EACH STATEMENT EXECUTE FUNCTION refuse_proof_file_removal_edit();