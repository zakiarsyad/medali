CREATE TABLE "mentor_survey_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fixing_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"respondents" smallint NOT NULL,
	"members" smallint NOT NULL,
	"achievement" numeric(4, 1) NOT NULL,
	"feedback" numeric(4, 1) NOT NULL,
	"score" numeric(4, 1) NOT NULL,
	CONSTRAINT "mentor_survey_results_once_per_group_and_mentor" UNIQUE("fixing_id","group_id","mentor_id"),
	CONSTRAINT "mentor_survey_results_enough_respondents" CHECK ("mentor_survey_results"."respondents" >= 3),
	CONSTRAINT "mentor_survey_results_values_0_to_100" CHECK ("mentor_survey_results"."achievement" between 0 and 100 and "mentor_survey_results"."feedback" between 0 and 100 and "mentor_survey_results"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "survey_result_fixings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_period_id" uuid NOT NULL,
	"fixed_by" uuid NOT NULL,
	"fixed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "survey_result_fixings_once_per_period" UNIQUE("survey_period_id")
);
--> statement-breakpoint
ALTER TABLE "mentor_survey_results" ADD CONSTRAINT "mentor_survey_results_fixing_id_survey_result_fixings_id_fk" FOREIGN KEY ("fixing_id") REFERENCES "public"."survey_result_fixings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_survey_results" ADD CONSTRAINT "mentor_survey_results_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_survey_results" ADD CONSTRAINT "mentor_survey_results_mentor_id_accounts_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_result_fixings" ADD CONSTRAINT "survey_result_fixings_survey_period_id_student_survey_periods_id_fk" FOREIGN KEY ("survey_period_id") REFERENCES "public"."student_survey_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_result_fixings" ADD CONSTRAINT "survey_result_fixings_fixed_by_accounts_id_fk" FOREIGN KEY ("fixed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_survey_results_group" ON "mentor_survey_results" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "mentor_survey_results_mentor" ON "mentor_survey_results" USING btree ("mentor_id");--> statement-breakpoint
-- Added by hand. Fixed survey results are lines of the mentors'
-- evaluation history that must always be trusted, and a fixing is also
-- the record of who fixed them and when, so the database itself refuses
-- to change or delete either. Row triggers do not see TRUNCATE, which
-- would empty a table in one statement, so that has a trigger of its own.
CREATE FUNCTION refuse_survey_result_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Fixed survey results cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER survey_result_fixings_cannot_change
BEFORE UPDATE OR DELETE ON survey_result_fixings
FOR EACH ROW EXECUTE FUNCTION refuse_survey_result_edit();--> statement-breakpoint
CREATE TRIGGER survey_result_fixings_cannot_be_emptied
BEFORE TRUNCATE ON survey_result_fixings
FOR EACH STATEMENT EXECUTE FUNCTION refuse_survey_result_edit();--> statement-breakpoint
CREATE TRIGGER mentor_survey_results_cannot_change
BEFORE UPDATE OR DELETE ON mentor_survey_results
FOR EACH ROW EXECUTE FUNCTION refuse_survey_result_edit();--> statement-breakpoint
CREATE TRIGGER mentor_survey_results_cannot_be_emptied
BEFORE TRUNCATE ON mentor_survey_results
FOR EACH STATEMENT EXECUTE FUNCTION refuse_survey_result_edit();