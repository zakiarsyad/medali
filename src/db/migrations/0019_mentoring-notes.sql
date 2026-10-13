CREATE TYPE "public"."mentoring_follow_up" AS ENUM('none', 'watch_two_weeks', 'schedule_counselling', 'refer_to_psychologist', 'involve_parents');--> statement-breakpoint
CREATE TYPE "public"."mentoring_note_kind" AS ENUM('individual_counselling', 'group_mentoring', 'appreciation', 'attendance_monitoring', 'discipline_guidance', 'parent_visit');--> statement-breakpoint
CREATE TABLE "mentoring_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"written_by" uuid NOT NULL,
	"kind" "mentoring_note_kind" NOT NULL,
	"happened_on" date NOT NULL,
	"value_keys" text[] NOT NULL,
	"note" text NOT NULL,
	"follow_up" "mentoring_follow_up" NOT NULL,
	"written_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentoring_notes" ADD CONSTRAINT "mentoring_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_notes" ADD CONSTRAINT "mentoring_notes_written_by_accounts_id_fk" FOREIGN KEY ("written_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentoring_notes_student" ON "mentoring_notes" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "mentoring_notes_written_at" ON "mentoring_notes" USING btree ("written_at");