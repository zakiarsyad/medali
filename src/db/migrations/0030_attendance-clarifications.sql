CREATE TYPE "public"."activity_clarification_reason" AS ENUM('sick', 'family_matter', 'campus_duty', 'technical_trouble', 'present_not_recorded', 'other');--> statement-breakpoint
CREATE TYPE "public"."activity_clarification_status" AS ENUM('submitted', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "activity_clarification_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clarification_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_before" "activity_clarification_status" NOT NULL,
	"status_after" "activity_clarification_status" NOT NULL,
	"accepted_as" "activity_attendance_status",
	"note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_clarifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"reason" "activity_clarification_reason" NOT NULL,
	"explanation" text NOT NULL,
	"file_key" text,
	"file_name" text NOT NULL,
	"file_content_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"status" "activity_clarification_status" NOT NULL,
	"accepted_as" "activity_attendance_status",
	"note" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	CONSTRAINT "activity_clarifications_fileKey_unique" UNIQUE("file_key"),
	CONSTRAINT "activity_clarifications_decided_unless_submitted" CHECK (("activity_clarifications"."status" = 'submitted') = ("activity_clarifications"."decided_at" is null) and ("activity_clarifications"."decided_at" is null) = ("activity_clarifications"."decided_by" is null)),
	CONSTRAINT "activity_clarifications_accepted_as_present_or_dispensation" CHECK (("activity_clarifications"."status" = 'accepted') = ("activity_clarifications"."accepted_as" is not null) and ("activity_clarifications"."accepted_as" is null or "activity_clarifications"."accepted_as" in ('valid', 'dispensation')))
);
--> statement-breakpoint
ALTER TABLE "activity_clarification_changes" ADD CONSTRAINT "activity_clarification_changes_clarification_id_activity_clarifications_id_fk" FOREIGN KEY ("clarification_id") REFERENCES "public"."activity_clarifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_clarification_changes" ADD CONSTRAINT "activity_clarification_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_clarifications" ADD CONSTRAINT "activity_clarifications_schedule_id_activity_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."activity_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_clarifications" ADD CONSTRAINT "activity_clarifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_clarifications" ADD CONSTRAINT "activity_clarifications_decided_by_accounts_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_clarification_changes_clarification" ON "activity_clarification_changes" USING btree ("clarification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_clarifications_one_submitted" ON "activity_clarifications" USING btree ("schedule_id","student_id") WHERE "activity_clarifications"."status" = 'submitted';--> statement-breakpoint
CREATE INDEX "activity_clarifications_student" ON "activity_clarifications" USING btree ("student_id");--> statement-breakpoint
-- Added by hand. The log of clarification decisions is a record that must
-- always be trusted, because a decision changes an attendance and so a
-- score, so the database itself refuses to change or delete a line of it.
-- Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own. A clarification is held by
-- its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_activity_clarification_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of clarification decisions cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER activity_clarification_changes_cannot_change
BEFORE UPDATE OR DELETE ON activity_clarification_changes
FOR EACH ROW EXECUTE FUNCTION refuse_activity_clarification_change_edit();--> statement-breakpoint
CREATE TRIGGER activity_clarification_changes_cannot_be_emptied
BEFORE TRUNCATE ON activity_clarification_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_activity_clarification_change_edit();
