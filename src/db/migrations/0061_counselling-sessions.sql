CREATE TYPE "public"."counselling_follow_up" AS ENUM('next_session', 'monitoring', 'refer_psychologist', 'refer_psychiatrist', 'closed');--> statement-breakpoint
CREATE TYPE "public"."counselling_session_kind" AS ENUM('individual_in_person', 'individual_online', 'group');--> statement-breakpoint
CREATE TYPE "public"."counselling_session_step" AS ENUM('write', 'change');--> statement-breakpoint
CREATE TABLE "counselling_session_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"step" "counselling_session_step" NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselling_session_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"read_by" uuid NOT NULL,
	"read_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselling_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"schedule_id" uuid,
	"day" date NOT NULL,
	"kind" "counselling_session_kind" NOT NULL,
	"topic" "counselling_topic" NOT NULL,
	"notes" text NOT NULL,
	"follow_up" "counselling_follow_up" NOT NULL,
	"next_day" date,
	"written_by" uuid NOT NULL,
	"written_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "counselling_sessions_one_per_schedule" UNIQUE("schedule_id"),
	CONSTRAINT "counselling_sessions_notes_length" CHECK (char_length(trim("counselling_sessions"."notes")) > 0 and char_length("counselling_sessions"."notes") <= 5000),
	CONSTRAINT "counselling_sessions_next_after_day" CHECK ("counselling_sessions"."next_day" is null or "counselling_sessions"."next_day" >= "counselling_sessions"."day")
);
--> statement-breakpoint
ALTER TABLE "counselling_session_changes" ADD CONSTRAINT "counselling_session_changes_session_id_counselling_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."counselling_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_session_changes" ADD CONSTRAINT "counselling_session_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_session_reads" ADD CONSTRAINT "counselling_session_reads_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_session_reads" ADD CONSTRAINT "counselling_session_reads_read_by_accounts_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sessions" ADD CONSTRAINT "counselling_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sessions" ADD CONSTRAINT "counselling_sessions_schedule_id_counselling_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."counselling_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sessions" ADD CONSTRAINT "counselling_sessions_written_by_accounts_id_fk" FOREIGN KEY ("written_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sessions" ADD CONSTRAINT "counselling_sessions_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "counselling_session_changes_session" ON "counselling_session_changes" USING btree ("session_id","changed_at");--> statement-breakpoint
CREATE INDEX "counselling_session_reads_student" ON "counselling_session_reads" USING btree ("student_id","read_at");--> statement-breakpoint
CREATE INDEX "counselling_sessions_student" ON "counselling_sessions" USING btree ("student_id","day","written_at");--> statement-breakpoint
-- Added by hand. The logs of counselling sessions, of their changes and
-- of who read them, are records that must always be trusted, so the
-- database itself refuses to change or delete a line of them. Row
-- triggers do not see TRUNCATE, which would empty a log in one
-- statement, so that has a trigger of its own. A session is held by its
-- log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_counselling_session_log_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The logs of counselling sessions cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER counselling_session_changes_cannot_change
BEFORE UPDATE OR DELETE ON counselling_session_changes
FOR EACH ROW EXECUTE FUNCTION refuse_counselling_session_log_edit();--> statement-breakpoint
CREATE TRIGGER counselling_session_changes_cannot_be_emptied
BEFORE TRUNCATE ON counselling_session_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_counselling_session_log_edit();--> statement-breakpoint
CREATE TRIGGER counselling_session_reads_cannot_change
BEFORE UPDATE OR DELETE ON counselling_session_reads
FOR EACH ROW EXECUTE FUNCTION refuse_counselling_session_log_edit();--> statement-breakpoint
CREATE TRIGGER counselling_session_reads_cannot_be_emptied
BEFORE TRUNCATE ON counselling_session_reads
FOR EACH STATEMENT EXECUTE FUNCTION refuse_counselling_session_log_edit();
