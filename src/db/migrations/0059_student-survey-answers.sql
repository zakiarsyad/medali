CREATE TABLE "student_survey_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_period_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"scores" smallint[] NOT NULL,
	"suggestion" text,
	"sent_at" timestamp with time zone NOT NULL,
	CONSTRAINT "student_survey_answers_a_score_for_each_statement" CHECK (cardinality("student_survey_answers"."scores") = 8
        and array_position("student_survey_answers"."scores", null) is null
        and 1 <= all("student_survey_answers"."scores")
        and 5 >= all("student_survey_answers"."scores")),
	CONSTRAINT "student_survey_answers_suggestion_length" CHECK ("student_survey_answers"."suggestion" is null or (btrim("student_survey_answers"."suggestion") <> ''
        and char_length("student_survey_answers"."suggestion") <= 600))
);
--> statement-breakpoint
ALTER TABLE "student_survey_answers" ADD CONSTRAINT "student_survey_answers_survey_period_id_student_survey_periods_id_fk" FOREIGN KEY ("survey_period_id") REFERENCES "public"."student_survey_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_survey_answers" ADD CONSTRAINT "student_survey_answers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_survey_answers" ADD CONSTRAINT "student_survey_answers_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_survey_answers" ADD CONSTRAINT "student_survey_answers_mentor_id_accounts_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "student_survey_answers_one_per_student" ON "student_survey_answers" USING btree ("survey_period_id","student_id");