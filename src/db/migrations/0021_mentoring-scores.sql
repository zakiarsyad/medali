CREATE TABLE "mentoring_score_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"score_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score_before" smallint,
	"score_after" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	"scored_by" uuid NOT NULL,
	"scored_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mentoring_scores_one_per_student_and_period" UNIQUE("student_id","period_id"),
	CONSTRAINT "mentoring_scores_score_in_range" CHECK ("mentoring_scores"."score" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "mentoring_score_changes" ADD CONSTRAINT "mentoring_score_changes_score_id_mentoring_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."mentoring_scores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_score_changes" ADD CONSTRAINT "mentoring_score_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_scores" ADD CONSTRAINT "mentoring_scores_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_scores" ADD CONSTRAINT "mentoring_scores_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_scores" ADD CONSTRAINT "mentoring_scores_scored_by_accounts_id_fk" FOREIGN KEY ("scored_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentoring_score_changes_score" ON "mentoring_score_changes" USING btree ("score_id");--> statement-breakpoint
-- Added by hand. The log of mentoring scores is a record that must always
-- be trusted, so the database itself refuses to change or delete a line
-- of it. Row triggers do not see TRUNCATE, which would empty the log in
-- one statement, so that has a trigger of its own. A score is held by its
-- log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_mentoring_score_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of mentoring scores cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mentoring_score_changes_cannot_change
BEFORE UPDATE OR DELETE ON mentoring_score_changes
FOR EACH ROW EXECUTE FUNCTION refuse_mentoring_score_change_edit();--> statement-breakpoint
CREATE TRIGGER mentoring_score_changes_cannot_be_emptied
BEFORE TRUNCATE ON mentoring_score_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mentoring_score_change_edit();