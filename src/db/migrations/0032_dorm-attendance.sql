CREATE TABLE "dorm_attendance_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"count_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"marks_before" jsonb,
	"marks_after" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_attendance_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"day" date NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"saved_by" uuid NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	"announced_by" uuid,
	"announced_at" timestamp with time zone,
	CONSTRAINT "dorm_attendance_counts_one_per_activity_and_day" UNIQUE("activity_id","day"),
	CONSTRAINT "dorm_attendance_counts_announcement_is_whole" CHECK (("dorm_attendance_counts"."announced_by" is null) = ("dorm_attendance_counts"."announced_at" is null))
);
--> statement-breakpoint
CREATE TABLE "dorm_attendance_marks" (
	"count_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"is_absent" boolean NOT NULL,
	"note" text NOT NULL,
	CONSTRAINT "dorm_attendance_marks_count_id_student_id_pk" PRIMARY KEY("count_id","student_id"),
	CONSTRAINT "dorm_attendance_marks_note_length" CHECK (char_length("dorm_attendance_marks"."note") <= 200)
);
--> statement-breakpoint
ALTER TABLE "dorm_attendance_changes" ADD CONSTRAINT "dorm_attendance_changes_count_id_dorm_attendance_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."dorm_attendance_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_attendance_changes" ADD CONSTRAINT "dorm_attendance_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_attendance_counts" ADD CONSTRAINT "dorm_attendance_counts_activity_id_dorm_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."dorm_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_attendance_counts" ADD CONSTRAINT "dorm_attendance_counts_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_attendance_counts" ADD CONSTRAINT "dorm_attendance_counts_announced_by_accounts_id_fk" FOREIGN KEY ("announced_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_attendance_marks" ADD CONSTRAINT "dorm_attendance_marks_count_id_dorm_attendance_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."dorm_attendance_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_attendance_marks" ADD CONSTRAINT "dorm_attendance_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_attendance_changes_count" ON "dorm_attendance_changes" USING btree ("count_id");--> statement-breakpoint
CREATE INDEX "dorm_attendance_marks_student" ON "dorm_attendance_marks" USING btree ("student_id");--> statement-breakpoint
-- Added by hand. The log of dorm attendance announcements is a record that
-- must always be trusted, because an absence can lead to a warning letter,
-- so the database itself refuses to change or delete a line of it. Row
-- triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own. A count is held by its log
-- lines, so it cannot be deleted either.
CREATE FUNCTION refuse_dorm_attendance_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of dorm attendance announcements cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_attendance_changes_cannot_change
BEFORE UPDATE OR DELETE ON dorm_attendance_changes
FOR EACH ROW EXECUTE FUNCTION refuse_dorm_attendance_change_edit();--> statement-breakpoint
CREATE TRIGGER dorm_attendance_changes_cannot_be_emptied
BEFORE TRUNCATE ON dorm_attendance_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_dorm_attendance_change_edit();
