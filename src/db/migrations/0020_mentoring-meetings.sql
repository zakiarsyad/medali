CREATE TYPE "public"."attendance_mark" AS ENUM('present', 'excused', 'sick', 'absent');--> statement-breakpoint
CREATE TABLE "mentoring_attendance" (
	"meeting_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"mark" "attendance_mark" NOT NULL,
	CONSTRAINT "mentoring_attendance_meeting_id_student_id_pk" PRIMARY KEY("meeting_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "mentoring_meeting_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"held_on_before" date,
	"topic_before" text,
	"marks_before" jsonb,
	"held_on_after" date NOT NULL,
	"topic_after" text NOT NULL,
	"marks_after" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"number" smallint NOT NULL,
	"held_on" date NOT NULL,
	"topic" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"saved_by" uuid NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mentoring_meetings_one_per_group_period_and_number" UNIQUE("group_id","period_id","number"),
	CONSTRAINT "mentoring_meetings_number_in_range" CHECK ("mentoring_meetings"."number" between 1 and 4)
);
--> statement-breakpoint
ALTER TABLE "mentoring_attendance" ADD CONSTRAINT "mentoring_attendance_meeting_id_mentoring_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."mentoring_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_attendance" ADD CONSTRAINT "mentoring_attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_meeting_changes" ADD CONSTRAINT "mentoring_meeting_changes_meeting_id_mentoring_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."mentoring_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_meeting_changes" ADD CONSTRAINT "mentoring_meeting_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_meetings" ADD CONSTRAINT "mentoring_meetings_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_meetings" ADD CONSTRAINT "mentoring_meetings_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_meetings" ADD CONSTRAINT "mentoring_meetings_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentoring_meeting_changes_meeting" ON "mentoring_meeting_changes" USING btree ("meeting_id");--> statement-breakpoint
-- Added by hand. The log of attendance lists is a record that must always
-- be trusted, so the database itself refuses to change or delete a line
-- of it. Row triggers do not see TRUNCATE, which would empty the log in
-- one statement, so that has a trigger of its own. A meeting is held by
-- its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_mentoring_meeting_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of mentoring meetings cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mentoring_meeting_changes_cannot_change
BEFORE UPDATE OR DELETE ON mentoring_meeting_changes
FOR EACH ROW EXECUTE FUNCTION refuse_mentoring_meeting_change_edit();--> statement-breakpoint
CREATE TRIGGER mentoring_meeting_changes_cannot_be_emptied
BEFORE TRUNCATE ON mentoring_meeting_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mentoring_meeting_change_edit();
