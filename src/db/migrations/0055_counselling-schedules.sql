CREATE TYPE "public"."counselling_hour" AS ENUM('08:30', '10:00', '13:00', '14:30');--> statement-breakpoint
CREATE TYPE "public"."counselling_schedule_kind" AS ENUM('voluntary');--> statement-breakpoint
CREATE TYPE "public"."counselling_schedule_status" AS ENUM('submitted', 'proposed', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."counselling_schedule_step" AS ENUM('register', 'approve', 'propose', 'accept', 'ask_another');--> statement-breakpoint
CREATE TYPE "public"."counselling_topic" AS ENUM('academic', 'campus_adjustment', 'family', 'social_relations', 'finances', 'emotions_and_stress', 'other');--> statement-breakpoint
CREATE TYPE "public"."counselling_way" AS ENUM('in_person', 'online');--> statement-breakpoint
ALTER TYPE "public"."counselling_consent_way" ADD VALUE 'registration';--> statement-breakpoint
CREATE TABLE "counselling_schedule_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"step" "counselling_schedule_step" NOT NULL,
	"status_before" "counselling_schedule_status",
	"status_after" "counselling_schedule_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselling_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" "counselling_schedule_kind" NOT NULL,
	"status" "counselling_schedule_status" NOT NULL,
	"topic" "counselling_topic" NOT NULL,
	"day" date NOT NULL,
	"hour" "counselling_hour" NOT NULL,
	"way" "counselling_way" NOT NULL,
	"story" text,
	"counsellor_message" text,
	"reason" text,
	"counsellor_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "counselling_schedules_story_length" CHECK (char_length("counselling_schedules"."story") <= 1000),
	CONSTRAINT "counselling_schedules_message_length" CHECK (char_length("counselling_schedules"."counsellor_message") <= 500),
	CONSTRAINT "counselling_schedules_reason_length" CHECK (char_length("counselling_schedules"."reason") <= 500),
	CONSTRAINT "counselling_schedules_counsellor_once_proposed" CHECK ("counselling_schedules"."status" = 'submitted' or "counselling_schedules"."counsellor_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "counselling_schedule_changes" ADD CONSTRAINT "counselling_schedule_changes_schedule_id_counselling_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."counselling_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_schedule_changes" ADD CONSTRAINT "counselling_schedule_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_counsellor_id_accounts_id_fk" FOREIGN KEY ("counsellor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "counselling_schedule_changes_schedule" ON "counselling_schedule_changes" USING btree ("schedule_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "counselling_schedules_one_active_voluntary" ON "counselling_schedules" USING btree ("student_id") WHERE "counselling_schedules"."kind" = 'voluntary' and "counselling_schedules"."status" in ('submitted', 'proposed', 'scheduled');--> statement-breakpoint
CREATE INDEX "counselling_schedules_status" ON "counselling_schedules" USING btree ("status","day");--> statement-breakpoint
-- Added by hand. The log of counselling schedules is a record that must
-- always be trusted, so the database itself refuses to change or delete
-- a line of it. Row triggers do not see TRUNCATE, which would empty the
-- log in one statement, so that has a trigger of its own. A schedule is
-- held by its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_counselling_schedule_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of counselling schedules cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER counselling_schedule_changes_cannot_change
BEFORE UPDATE OR DELETE ON counselling_schedule_changes
FOR EACH ROW EXECUTE FUNCTION refuse_counselling_schedule_change_edit();--> statement-breakpoint
CREATE TRIGGER counselling_schedule_changes_cannot_be_emptied
BEFORE TRUNCATE ON counselling_schedule_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_counselling_schedule_change_edit();
