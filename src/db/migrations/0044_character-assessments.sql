CREATE TYPE "public"."character_assessment_source" AS ENUM('mentor_observation', 'self_assessment', 'peer_assessment', 'mentor_board_meeting', 'medali_instrument');--> statement-breakpoint
CREATE TABLE "character_assessments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"score_m" smallint NOT NULL,
	"score_e" smallint NOT NULL,
	"score_d" smallint NOT NULL,
	"score_a" smallint NOT NULL,
	"score_l" smallint NOT NULL,
	"score_i" smallint NOT NULL,
	"source" character_assessment_source NOT NULL,
	"note" text NOT NULL,
	"period_id" uuid NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	CONSTRAINT "character_assessments_scores_in_range" CHECK ("character_assessments"."score_m" between 40 and 100 and "character_assessments"."score_e" between 40 and 100 and "character_assessments"."score_d" between 40 and 100 and "character_assessments"."score_a" between 40 and 100 and "character_assessments"."score_l" between 40 and 100 and "character_assessments"."score_i" between 40 and 100),
	CONSTRAINT "character_assessments_note_length" CHECK (char_length("character_assessments"."note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "character_assessments" ADD CONSTRAINT "character_assessments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_assessments" ADD CONSTRAINT "character_assessments_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_assessments" ADD CONSTRAINT "character_assessments_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_assessments_student" ON "character_assessments" USING btree ("student_id","entered_at");--> statement-breakpoint
-- Added by hand. A character assessment is a record of a score that must
-- always be trusted, and is never corrected in place: a wrong one is
-- replaced by a new one. So the database itself refuses to change or
-- delete one. Row triggers do not see TRUNCATE, which would empty the
-- table in one statement, so that has a trigger of its own.
CREATE FUNCTION refuse_character_assessment_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Character assessments cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER character_assessments_cannot_change
BEFORE UPDATE OR DELETE ON character_assessments
FOR EACH ROW EXECUTE FUNCTION refuse_character_assessment_edit();--> statement-breakpoint
CREATE TRIGGER character_assessments_cannot_be_emptied
BEFORE TRUNCATE ON character_assessments
FOR EACH STATEMENT EXECUTE FUNCTION refuse_character_assessment_edit();
