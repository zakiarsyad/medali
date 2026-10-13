CREATE TABLE "mentor_evaluation_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activity_before" smallint,
	"attendance_before" smallint,
	"achievement_before" smallint,
	"feedback_before" smallint,
	"note_before" text,
	"activity_after" smallint NOT NULL,
	"attendance_after" smallint NOT NULL,
	"achievement_after" smallint NOT NULL,
	"feedback_after" smallint NOT NULL,
	"note_after" text
);
--> statement-breakpoint
CREATE TABLE "mentor_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"activity" smallint NOT NULL,
	"attendance" smallint NOT NULL,
	"achievement" smallint NOT NULL,
	"feedback" smallint NOT NULL,
	"note" text,
	"evaluated_by" uuid NOT NULL,
	"evaluated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mentor_evaluations_one_per_group_and_period" UNIQUE("group_id","period_id"),
	CONSTRAINT "mentor_evaluations_values_0_to_100" CHECK ("mentor_evaluations"."activity" between 0 and 100 and "mentor_evaluations"."attendance" between 0 and 100 and "mentor_evaluations"."achievement" between 0 and 100 and "mentor_evaluations"."feedback" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "mentor_evaluation_changes" ADD CONSTRAINT "mentor_evaluation_changes_evaluation_id_mentor_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."mentor_evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_evaluation_changes" ADD CONSTRAINT "mentor_evaluation_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_evaluations" ADD CONSTRAINT "mentor_evaluations_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_evaluations" ADD CONSTRAINT "mentor_evaluations_mentor_id_accounts_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_evaluations" ADD CONSTRAINT "mentor_evaluations_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_evaluations" ADD CONSTRAINT "mentor_evaluations_evaluated_by_accounts_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_evaluation_changes_evaluation" ON "mentor_evaluation_changes" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "mentor_evaluations_mentor" ON "mentor_evaluations" USING btree ("mentor_id");--> statement-breakpoint
-- Added by hand. The log of evaluations is a record that must always be
-- trusted, so the database itself refuses to change or delete a line of
-- it. Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own. An evaluation is held by
-- its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_mentor_evaluation_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of mentor evaluations cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mentor_evaluation_changes_cannot_change
BEFORE UPDATE OR DELETE ON mentor_evaluation_changes
FOR EACH ROW EXECUTE FUNCTION refuse_mentor_evaluation_change_edit();--> statement-breakpoint
CREATE TRIGGER mentor_evaluation_changes_cannot_be_emptied
BEFORE TRUNCATE ON mentor_evaluation_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mentor_evaluation_change_edit();