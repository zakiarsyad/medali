CREATE TABLE "fitness_category_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"excellent_from" smallint NOT NULL,
	"good_from" smallint NOT NULL,
	"attention_from" smallint NOT NULL,
	"before" jsonb NOT NULL,
	"replaces" uuid,
	"set_by" uuid NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fitness_category_limits_replaced_once" UNIQUE NULLS NOT DISTINCT("replaces"),
	CONSTRAINT "fitness_category_limits_in_range" CHECK ("fitness_category_limits"."excellent_from" between 1 and 100 and "fitness_category_limits"."good_from" between 1 and 100 and "fitness_category_limits"."attention_from" between 1 and 100),
	CONSTRAINT "fitness_category_limits_go_down" CHECK ("fitness_category_limits"."excellent_from" > "fitness_category_limits"."good_from" and "fitness_category_limits"."good_from" > "fitness_category_limits"."attention_from")
);
--> statement-breakpoint
CREATE TABLE "fitness_scores" (
	"test_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	CONSTRAINT "fitness_scores_test_id_student_id_pk" PRIMARY KEY("test_id","student_id"),
	CONSTRAINT "fitness_scores_score_in_range" CHECK ("fitness_scores"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "fitness_tests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"tested_on" date NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fitness_category_limits" ADD CONSTRAINT "fitness_category_limits_replaces_fitness_category_limits_id_fk" FOREIGN KEY ("replaces") REFERENCES "public"."fitness_category_limits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_category_limits" ADD CONSTRAINT "fitness_category_limits_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_scores" ADD CONSTRAINT "fitness_scores_test_id_fitness_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."fitness_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_scores" ADD CONSTRAINT "fitness_scores_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD CONSTRAINT "fitness_tests_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD CONSTRAINT "fitness_tests_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fitness_category_limits_set_at" ON "fitness_category_limits" USING btree ("set_at");--> statement-breakpoint
CREATE INDEX "fitness_scores_student" ON "fitness_scores" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fitness_tests_entered_at" ON "fitness_tests" USING btree ("entered_at");--> statement-breakpoint
-- Added by hand. The fitness scores and the settings of their limits are
-- the log of a score, which must always be trusted, so the database
-- itself refuses to change or delete one. Row triggers do not see
-- TRUNCATE, which would empty the log in one statement, so that has a
-- trigger of its own.
CREATE FUNCTION refuse_fitness_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The fitness scores and their limits cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER fitness_category_limits_cannot_change
BEFORE UPDATE OR DELETE ON fitness_category_limits
FOR EACH ROW EXECUTE FUNCTION refuse_fitness_edit();--> statement-breakpoint
CREATE TRIGGER fitness_category_limits_cannot_be_emptied
BEFORE TRUNCATE ON fitness_category_limits
FOR EACH STATEMENT EXECUTE FUNCTION refuse_fitness_edit();--> statement-breakpoint
CREATE TRIGGER fitness_tests_cannot_change
BEFORE UPDATE OR DELETE ON fitness_tests
FOR EACH ROW EXECUTE FUNCTION refuse_fitness_edit();--> statement-breakpoint
CREATE TRIGGER fitness_tests_cannot_be_emptied
BEFORE TRUNCATE ON fitness_tests
FOR EACH STATEMENT EXECUTE FUNCTION refuse_fitness_edit();--> statement-breakpoint
CREATE TRIGGER fitness_scores_cannot_change
BEFORE UPDATE OR DELETE ON fitness_scores
FOR EACH ROW EXECUTE FUNCTION refuse_fitness_edit();--> statement-breakpoint
CREATE TRIGGER fitness_scores_cannot_be_emptied
BEFORE TRUNCATE ON fitness_scores
FOR EACH STATEMENT EXECUTE FUNCTION refuse_fitness_edit();
