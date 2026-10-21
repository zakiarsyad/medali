CREATE TYPE "public"."discipline_penalty_category" AS ENUM('light', 'medium', 'heavy');--> statement-breakpoint
CREATE TYPE "public"."discipline_penalty_change_action" AS ENUM('added');--> statement-breakpoint
CREATE TYPE "public"."discipline_penalty_status" AS ENUM('imposed', 'set');--> statement-breakpoint
CREATE TYPE "public"."social_work_form" AS ENUM('staff_help', 'traffic', 'grounds', 'community', 'other');--> statement-breakpoint
CREATE TYPE "public"."social_work_place" AS ENUM('campus', 'home_agency', 'outside');--> statement-breakpoint
CREATE TABLE "discipline_penalties" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"day" date NOT NULL,
	"description" text NOT NULL,
	"category" "discipline_penalty_category" NOT NULL,
	"level" smallint NOT NULL,
	"status" "discipline_penalty_status" NOT NULL,
	"decision_number" text DEFAULT '' NOT NULL,
	"social_work_forms" "social_work_form"[] DEFAULT '{}' NOT NULL,
	"social_work_other" text DEFAULT '' NOT NULL,
	"social_work_place" "social_work_place",
	"social_work_starts_on" date,
	"social_work_ends_on" date,
	"saved_by" uuid NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "discipline_penalties_level" CHECK ("discipline_penalties"."level" between 1 and 3),
	CONSTRAINT "discipline_penalties_description_length" CHECK (char_length("discipline_penalties"."description") between 5 and 1000),
	CONSTRAINT "discipline_penalties_decision_number_length" CHECK (char_length("discipline_penalties"."decision_number") <= 100),
	CONSTRAINT "discipline_penalties_set_only_when_dismissed" CHECK (("discipline_penalties"."status" = 'set') = ("discipline_penalties"."category" = 'heavy' and "discipline_penalties"."level" >= 2)),
	CONSTRAINT "discipline_penalties_social_work_unless_dismissed" CHECK (("discipline_penalties"."social_work_starts_on" is null) = ("discipline_penalties"."status" = 'set')),
	CONSTRAINT "discipline_penalties_social_work_is_whole" CHECK (("discipline_penalties"."social_work_ends_on" is null) = ("discipline_penalties"."social_work_starts_on" is null)
        and ("discipline_penalties"."social_work_place" is null) = ("discipline_penalties"."social_work_starts_on" is null)
        and (cardinality("discipline_penalties"."social_work_forms") = 0) = ("discipline_penalties"."social_work_starts_on" is null)),
	CONSTRAINT "discipline_penalties_social_work_from_its_day" CHECK ("discipline_penalties"."social_work_starts_on" is null or ("discipline_penalties"."social_work_starts_on" >= "discipline_penalties"."day" and "discipline_penalties"."social_work_ends_on" >= "discipline_penalties"."social_work_starts_on")),
	CONSTRAINT "discipline_penalties_other_social_work_only_for_other" CHECK (('other' = any("discipline_penalties"."social_work_forms")) = ("discipline_penalties"."social_work_other" <> '')),
	CONSTRAINT "discipline_penalties_other_social_work_length" CHECK (char_length("discipline_penalties"."social_work_other") <= 200),
	CONSTRAINT "discipline_penalties_saved_from_its_day" CHECK (("discipline_penalties"."saved_at" at time zone 'Asia/Jakarta')::date >= "discipline_penalties"."day")
);
--> statement-breakpoint
CREATE TABLE "discipline_penalty_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"penalty_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"action" "discipline_penalty_change_action" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD CONSTRAINT "discipline_penalties_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD CONSTRAINT "discipline_penalties_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD CONSTRAINT "discipline_penalty_changes_penalty_id_discipline_penalties_id_fk" FOREIGN KEY ("penalty_id") REFERENCES "public"."discipline_penalties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD CONSTRAINT "discipline_penalty_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discipline_penalties_student" ON "discipline_penalties" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "discipline_penalties_day" ON "discipline_penalties" USING btree ("day");--> statement-breakpoint
CREATE INDEX "discipline_penalty_changes_penalty" ON "discipline_penalty_changes" USING btree ("penalty_id");--> statement-breakpoint
-- Added by hand. The log of discipline penalties must always be trusted,
-- so the database itself refuses to change or delete a line of it. A
-- penalty is a discipline record, which is never deleted. Row triggers do
-- not see TRUNCATE, which would empty a table in one statement, so that
-- has a trigger of its own.
CREATE FUNCTION refuse_discipline_penalty_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of discipline penalties cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER discipline_penalty_changes_cannot_change
BEFORE UPDATE OR DELETE ON discipline_penalty_changes
FOR EACH ROW EXECUTE FUNCTION refuse_discipline_penalty_change_edit();--> statement-breakpoint
CREATE TRIGGER discipline_penalty_changes_cannot_be_emptied
BEFORE TRUNCATE ON discipline_penalty_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_discipline_penalty_change_edit();--> statement-breakpoint
CREATE FUNCTION refuse_discipline_penalty_removal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A discipline penalty cannot be deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER discipline_penalties_cannot_be_deleted
BEFORE DELETE ON discipline_penalties
FOR EACH ROW EXECUTE FUNCTION refuse_discipline_penalty_removal();--> statement-breakpoint
CREATE TRIGGER discipline_penalties_cannot_be_emptied
BEFORE TRUNCATE ON discipline_penalties
FOR EACH STATEMENT EXECUTE FUNCTION refuse_discipline_penalty_removal();
