CREATE TABLE "student_survey_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"achievement_weight" smallint NOT NULL,
	"note" text,
	"opened_by" uuid NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_by" uuid,
	"closed_at" timestamp with time zone,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "student_survey_periods_ends_on_or_after_start" CHECK ("student_survey_periods"."ends_on" >= "student_survey_periods"."starts_on"),
	CONSTRAINT "student_survey_periods_weight_0_to_100" CHECK ("student_survey_periods"."achievement_weight" between 0 and 100),
	CONSTRAINT "student_survey_periods_closed_with_who_and_when" CHECK (("student_survey_periods"."closed_at" is null) = ("student_survey_periods"."closed_by" is null)),
	CONSTRAINT "student_survey_periods_cancelled_with_who_and_when" CHECK (("student_survey_periods"."cancelled_at" is null) = ("student_survey_periods"."cancelled_by" is null)),
	CONSTRAINT "student_survey_periods_not_closed_and_cancelled" CHECK ("student_survey_periods"."closed_at" is null or "student_survey_periods"."cancelled_at" is null)
);
--> statement-breakpoint
ALTER TABLE "student_survey_periods" ADD CONSTRAINT "student_survey_periods_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_survey_periods" ADD CONSTRAINT "student_survey_periods_opened_by_accounts_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_survey_periods" ADD CONSTRAINT "student_survey_periods_closed_by_accounts_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_survey_periods" ADD CONSTRAINT "student_survey_periods_cancelled_by_accounts_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Added by hand. One survey period runs at a time: a period runs until
-- it is closed by hand, cancelled, or past its last day on campus. A
-- "one only" index cannot hold a rule that changes with the date, so a
-- trigger looks at every period that is added or changed. Two that
-- arrive at the same moment wait for each other, so the second sees the
-- first. The refusal carries the code and a name of a "one only" rule,
-- so the app tells it from any other fault.
CREATE FUNCTION refuse_second_running_survey_period() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  today date := (clock_timestamp() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
  IF NEW.closed_at IS NOT NULL OR NEW.cancelled_at IS NOT NULL
    OR NEW.ends_on < today THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('student_survey_periods'));
  IF EXISTS (
    SELECT 1 FROM student_survey_periods
    WHERE id <> NEW.id
      AND closed_at IS NULL
      AND cancelled_at IS NULL
      AND ends_on >= today
  ) THEN
    RAISE EXCEPTION 'A student survey period is running already.'
      USING ERRCODE = 'unique_violation',
        CONSTRAINT = 'student_survey_periods_one_running';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER student_survey_periods_one_running
BEFORE INSERT OR UPDATE ON student_survey_periods
FOR EACH ROW EXECUTE FUNCTION refuse_second_running_survey_period();--> statement-breakpoint
-- A survey period is the record of who opened, closed or cancelled it
-- and when, and a cancelled one stays as it is, so the database itself
-- refuses to delete one. Row triggers do not see TRUNCATE, which would
-- empty the table in one statement, so that has a trigger of its own.
CREATE FUNCTION refuse_student_survey_period_removal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A student survey period cannot be deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER student_survey_periods_cannot_be_deleted
BEFORE DELETE ON student_survey_periods
FOR EACH ROW EXECUTE FUNCTION refuse_student_survey_period_removal();--> statement-breakpoint
CREATE TRIGGER student_survey_periods_cannot_be_emptied
BEFORE TRUNCATE ON student_survey_periods
FOR EACH STATEMENT EXECUTE FUNCTION refuse_student_survey_period_removal();
