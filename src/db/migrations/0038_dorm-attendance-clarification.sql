CREATE TYPE "public"."dorm_clarification_accepted_as" AS ENUM('present', 'leave');--> statement-breakpoint
CREATE TYPE "public"."dorm_clarification_reason" AS ENUM('sick', 'family_matter', 'campus_duty', 'present_not_recorded', 'other');--> statement-breakpoint
CREATE TYPE "public"."dorm_clarification_status" AS ENUM('submitted', 'verified', 'accepted', 'rejected', 'closed');--> statement-breakpoint
CREATE TABLE "dorm_clarification_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clarification_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_before" "dorm_clarification_status" NOT NULL,
	"status_after" "dorm_clarification_status" NOT NULL,
	"accepted_as" "dorm_clarification_accepted_as",
	"note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_clarifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"count_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"reason" "dorm_clarification_reason" NOT NULL,
	"explanation" text NOT NULL,
	"file_key" text,
	"file_name" text NOT NULL,
	"file_content_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"status" "dorm_clarification_status" NOT NULL,
	"accepted_as" "dorm_clarification_accepted_as",
	"sent_at" timestamp with time zone NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"verify_note" text DEFAULT '' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decision_note" text DEFAULT '' NOT NULL,
	CONSTRAINT "dorm_clarifications_fileKey_unique" UNIQUE("file_key"),
	CONSTRAINT "dorm_clarifications_verified_when_checked" CHECK (("dorm_clarifications"."status" <> 'submitted' or "dorm_clarifications"."verified_at" is null) and ("dorm_clarifications"."status" not in ('verified', 'accepted', 'rejected') or "dorm_clarifications"."verified_at" is not null) and ("dorm_clarifications"."verified_at" is null) = ("dorm_clarifications"."verified_by" is null)),
	CONSTRAINT "dorm_clarifications_decided_when_final" CHECK (("dorm_clarifications"."status" not in ('submitted', 'verified') or "dorm_clarifications"."decided_at" is null) and ("dorm_clarifications"."status" not in ('accepted', 'closed') or "dorm_clarifications"."decided_at" is not null) and ("dorm_clarifications"."decided_at" is null) = ("dorm_clarifications"."decided_by" is null)),
	CONSTRAINT "dorm_clarifications_accepted_as_when_accepted" CHECK (("dorm_clarifications"."status" = 'accepted') = ("dorm_clarifications"."accepted_as" is not null)),
	CONSTRAINT "dorm_clarifications_rejected_has_note" CHECK ("dorm_clarifications"."status" <> 'rejected' or ("dorm_clarifications"."decided_at" is null and "dorm_clarifications"."verify_note" <> '') or ("dorm_clarifications"."decided_at" is not null and "dorm_clarifications"."decision_note" <> '')),
	CONSTRAINT "dorm_clarifications_verify_note_length" CHECK (char_length("dorm_clarifications"."verify_note") <= 200),
	CONSTRAINT "dorm_clarifications_decision_note_length" CHECK (char_length("dorm_clarifications"."decision_note") <= 200)
);
--> statement-breakpoint
ALTER TABLE "dorm_clarification_changes" ADD CONSTRAINT "dorm_clarification_changes_clarification_id_dorm_clarifications_id_fk" FOREIGN KEY ("clarification_id") REFERENCES "public"."dorm_clarifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_clarification_changes" ADD CONSTRAINT "dorm_clarification_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_clarifications" ADD CONSTRAINT "dorm_clarifications_count_id_dorm_attendance_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."dorm_attendance_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_clarifications" ADD CONSTRAINT "dorm_clarifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_clarifications" ADD CONSTRAINT "dorm_clarifications_verified_by_accounts_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_clarifications" ADD CONSTRAINT "dorm_clarifications_decided_by_accounts_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_clarification_changes_clarification" ON "dorm_clarification_changes" USING btree ("clarification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_clarifications_one_waiting" ON "dorm_clarifications" USING btree ("count_id","student_id") WHERE "dorm_clarifications"."status" in ('submitted', 'verified');--> statement-breakpoint
CREATE INDEX "dorm_clarifications_student" ON "dorm_clarifications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "dorm_clarifications_sent" ON "dorm_clarifications" USING btree ("sent_at");--> statement-breakpoint
-- Added by hand. The log of checks and decisions on dorm clarifications
-- is a record that must always be trusted, because an accepted
-- clarification changes an attendance, so the database itself refuses to
-- change or delete a line of it. Row triggers do not see TRUNCATE, which
-- would empty the log in one statement, so that has a trigger of its own.
-- A clarification is held by its log lines, so it cannot be deleted
-- either.
CREATE FUNCTION refuse_dorm_clarification_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of dorm clarification decisions cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_clarification_changes_cannot_change
BEFORE UPDATE OR DELETE ON dorm_clarification_changes
FOR EACH ROW EXECUTE FUNCTION refuse_dorm_clarification_change_edit();--> statement-breakpoint
CREATE TRIGGER dorm_clarification_changes_cannot_be_emptied
BEFORE TRUNCATE ON dorm_clarification_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_dorm_clarification_change_edit();