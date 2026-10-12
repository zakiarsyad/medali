CREATE TYPE "public"."cohort_assignment_change_action" AS ENUM('groups_formed', 'groups_reformed', 'draft_saved', 'submitted', 'fixed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cohort_assignment_method" AS ENUM('balanced', 'by_nim', 'by_class');--> statement-breakpoint
CREATE TYPE "public"."cohort_assignment_status" AS ENUM('draft', 'submitted', 'fixed', 'cancelled');--> statement-breakpoint
CREATE TABLE "cohort_assignment_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "cohort_assignment_change_action" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohort_assignment_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"study_program_id" integer NOT NULL,
	"entry_path" "entry_path" NOT NULL,
	"number" smallint NOT NULL,
	"mentor_id" uuid,
	"mentor_group_id" uuid,
	CONSTRAINT "cohort_assignment_groups_number_in_program" UNIQUE("assignment_id","study_program_id","entry_path","number"),
	CONSTRAINT "cohort_assignment_groups_number_from_1" CHECK ("cohort_assignment_groups"."number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "cohort_assignment_members" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohort_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_year" smallint NOT NULL,
	"status" "cohort_assignment_status" DEFAULT 'draft' NOT NULL,
	"target_size" smallint NOT NULL,
	"method" "cohort_assignment_method" NOT NULL,
	"decree_number" text,
	"effective_on" date,
	"version" integer DEFAULT 1 NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	"saved_by" uuid NOT NULL,
	CONSTRAINT "cohort_assignments_one_per_cohort" UNIQUE("cohort_year"),
	CONSTRAINT "cohort_assignments_target_size_in_range" CHECK ("cohort_assignments"."target_size" between 25 and 35),
	CONSTRAINT "cohort_assignments_fixed_with_decree_and_day" CHECK ("cohort_assignments"."status" <> 'fixed' or ("cohort_assignments"."decree_number" is not null and "cohort_assignments"."effective_on" is not null))
);
--> statement-breakpoint
CREATE TABLE "mentor_group_past_members" (
	"group_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	CONSTRAINT "mentor_group_past_members_group_id_student_id_pk" PRIMARY KEY("group_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "mentor_groups" DROP CONSTRAINT "mentor_groups_number_in_cohort";--> statement-breakpoint
ALTER TABLE "mentor_groups" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mentor_groups" ADD COLUMN "ended_by" uuid;--> statement-breakpoint
ALTER TABLE "cohort_assignment_changes" ADD CONSTRAINT "cohort_assignment_changes_assignment_id_cohort_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."cohort_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_changes" ADD CONSTRAINT "cohort_assignment_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_groups" ADD CONSTRAINT "cohort_assignment_groups_assignment_id_cohort_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."cohort_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_groups" ADD CONSTRAINT "cohort_assignment_groups_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_groups" ADD CONSTRAINT "cohort_assignment_groups_mentor_id_accounts_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_groups" ADD CONSTRAINT "cohort_assignment_groups_mentor_group_id_mentor_groups_id_fk" FOREIGN KEY ("mentor_group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_members" ADD CONSTRAINT "cohort_assignment_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignment_members" ADD CONSTRAINT "cohort_assignment_members_group_id_cohort_assignment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."cohort_assignment_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_assignments" ADD CONSTRAINT "cohort_assignments_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_past_members" ADD CONSTRAINT "mentor_group_past_members_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_past_members" ADD CONSTRAINT "mentor_group_past_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cohort_assignment_changes_assignment" ON "cohort_assignment_changes" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "cohort_assignment_members_group" ON "cohort_assignment_members" USING btree ("group_id");--> statement-breakpoint
ALTER TABLE "mentor_groups" ADD CONSTRAINT "mentor_groups_ended_by_accounts_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_groups_number_in_cohort" ON "mentor_groups" USING btree ("study_program_id","cohort_year","entry_path","number") WHERE "mentor_groups"."ended_at" is null;--> statement-breakpoint
ALTER TABLE "mentor_groups" ADD CONSTRAINT "mentor_groups_ended_with_who_and_when" CHECK (("mentor_groups"."ended_at" is null) = ("mentor_groups"."ended_by" is null));--> statement-breakpoint
-- Added by hand. The log of a penetapan is a record that must always be
-- trusted, so the database itself refuses to change or delete a line of
-- it. Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own.
CREATE FUNCTION refuse_cohort_assignment_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of a penetapan cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER cohort_assignment_changes_cannot_change
BEFORE UPDATE OR DELETE ON cohort_assignment_changes
FOR EACH ROW EXECUTE FUNCTION refuse_cohort_assignment_change_edit();--> statement-breakpoint
CREATE TRIGGER cohort_assignment_changes_cannot_be_emptied
BEFORE TRUNCATE ON cohort_assignment_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_cohort_assignment_change_edit();