CREATE TYPE "public"."mental_health_mark_category" AS ENUM('monitor', 'refer');--> statement-breakpoint
CREATE TABLE "mental_health_mark_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"category_before" "mental_health_mark_category",
	"observation_before" text NOT NULL,
	"category_after" "mental_health_mark_category",
	"observation_after" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mental_health_mark_changes_before_rules" CHECK (char_length("mental_health_mark_changes"."observation_before") <= 500 and ("mental_health_mark_changes"."category_before" is not null or "mental_health_mark_changes"."observation_before" = '') and ("mental_health_mark_changes"."category_before" is distinct from 'refer' or "mental_health_mark_changes"."observation_before" <> '')),
	CONSTRAINT "mental_health_mark_changes_after_rules" CHECK (char_length("mental_health_mark_changes"."observation_after") <= 500 and ("mental_health_mark_changes"."category_after" is not null or "mental_health_mark_changes"."observation_after" = '') and ("mental_health_mark_changes"."category_after" is distinct from 'refer' or "mental_health_mark_changes"."observation_after" <> '')),
	CONSTRAINT "mental_health_mark_changes_differs" CHECK (("mental_health_mark_changes"."category_before", "mental_health_mark_changes"."observation_before") is distinct from ("mental_health_mark_changes"."category_after", "mental_health_mark_changes"."observation_after"))
);
--> statement-breakpoint
CREATE TABLE "mental_health_marks" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"category" "mental_health_mark_category",
	"observation" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mental_health_marks_rules" CHECK (char_length("mental_health_marks"."observation") <= 500 and ("mental_health_marks"."category" is not null or "mental_health_marks"."observation" = '') and ("mental_health_marks"."category" is distinct from 'refer' or "mental_health_marks"."observation" <> ''))
);
--> statement-breakpoint
ALTER TABLE "mental_health_mark_changes" ADD CONSTRAINT "mental_health_mark_changes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_mark_changes" ADD CONSTRAINT "mental_health_mark_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_marks" ADD CONSTRAINT "mental_health_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_marks" ADD CONSTRAINT "mental_health_marks_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mental_health_mark_changes_student" ON "mental_health_mark_changes" USING btree ("student_id","changed_at");--> statement-breakpoint
-- Added by hand. The log of mental health marks must always be trusted,
-- so the database itself refuses to change or delete a line of it, and
-- a mark is never deleted: "Tidak ada indikasi" keeps its row. Row
-- triggers do not see TRUNCATE, which would empty a table in one
-- statement, so that has a trigger of its own.
CREATE FUNCTION refuse_mental_health_mark_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of mental health marks cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mental_health_mark_changes_cannot_change
BEFORE UPDATE OR DELETE ON mental_health_mark_changes
FOR EACH ROW EXECUTE FUNCTION refuse_mental_health_mark_change_edit();--> statement-breakpoint
CREATE TRIGGER mental_health_mark_changes_cannot_be_emptied
BEFORE TRUNCATE ON mental_health_mark_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mental_health_mark_change_edit();--> statement-breakpoint
CREATE FUNCTION refuse_mental_health_mark_removal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A mental health mark cannot be deleted; set it to no indication instead.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mental_health_marks_cannot_be_deleted
BEFORE DELETE ON mental_health_marks
FOR EACH ROW EXECUTE FUNCTION refuse_mental_health_mark_removal();--> statement-breakpoint
CREATE TRIGGER mental_health_marks_cannot_be_emptied
BEFORE TRUNCATE ON mental_health_marks
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mental_health_mark_removal();
