CREATE TABLE "fixed_character_grades" (
	"closing_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"attendance" numeric(4, 1),
	"attended" integer NOT NULL,
	"counted" integer NOT NULL,
	"mentoring" smallint,
	"siku" smallint NOT NULL,
	"siku_adjusted" boolean NOT NULL,
	"siku_note" text NOT NULL,
	"skpm" numeric(4, 1),
	"final" numeric(4, 1),
	"letter" "grade_letter",
	"passes" boolean,
	"limited" boolean NOT NULL,
	"limited_from" numeric(4, 1),
	CONSTRAINT "fixed_character_grades_closing_id_student_id_pk" PRIMARY KEY("closing_id","student_id"),
	CONSTRAINT "fixed_character_grades_complete_or_not" CHECK (("fixed_character_grades"."final" is null) = ("fixed_character_grades"."attendance" is null or "fixed_character_grades"."mentoring" is null or "fixed_character_grades"."skpm" is null) and ("fixed_character_grades"."final" is null) = ("fixed_character_grades"."letter" is null) and ("fixed_character_grades"."final" is null) = ("fixed_character_grades"."passes" is null)),
	CONSTRAINT "fixed_character_grades_limited_from" CHECK ("fixed_character_grades"."limited_from" is null or ("fixed_character_grades"."limited" and "fixed_character_grades"."final" is not null and "fixed_character_grades"."limited_from" > "fixed_character_grades"."final"))
);
--> statement-breakpoint
CREATE TABLE "semester_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"closed_by" uuid NOT NULL,
	"closed_at" timestamp with time zone NOT NULL,
	"attendance_weight" smallint NOT NULL,
	"mentoring_weight" smallint NOT NULL,
	"siku_weight" smallint NOT NULL,
	"skpm_weight" smallint NOT NULL,
	"a_from" smallint NOT NULL,
	"b_from" smallint NOT NULL,
	"c_from" smallint NOT NULL,
	"d_from" smallint NOT NULL,
	"pass_letter" "grade_letter" NOT NULL,
	"students" integer NOT NULL,
	"complete" integer NOT NULL,
	"incomplete" integer NOT NULL,
	CONSTRAINT "semester_closings_once_per_period" UNIQUE("period_id"),
	CONSTRAINT "semester_closings_counts_add_up" CHECK ("semester_closings"."complete" >= 0 and "semester_closings"."incomplete" >= 0 and "semester_closings"."complete" + "semester_closings"."incomplete" = "semester_closings"."students")
);
--> statement-breakpoint
ALTER TABLE "fixed_character_grades" ADD CONSTRAINT "fixed_character_grades_closing_id_semester_closings_id_fk" FOREIGN KEY ("closing_id") REFERENCES "public"."semester_closings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_character_grades" ADD CONSTRAINT "fixed_character_grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_closings" ADD CONSTRAINT "semester_closings_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_closings" ADD CONSTRAINT "semester_closings_closed_by_accounts_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Added by hand. A closed semester and the grades it fixed must always be
-- trusted, and the closing is also its line in the change log, so the
-- database itself refuses to change or delete either. Row triggers do not
-- see TRUNCATE, which would empty a table in one statement, so that has a
-- trigger of its own.
CREATE FUNCTION refuse_semester_closing_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A closed semester and its fixed grades cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER semester_closings_cannot_change
BEFORE UPDATE OR DELETE ON semester_closings
FOR EACH ROW EXECUTE FUNCTION refuse_semester_closing_edit();--> statement-breakpoint
CREATE TRIGGER semester_closings_cannot_be_emptied
BEFORE TRUNCATE ON semester_closings
FOR EACH STATEMENT EXECUTE FUNCTION refuse_semester_closing_edit();--> statement-breakpoint
CREATE TRIGGER fixed_character_grades_cannot_change
BEFORE UPDATE OR DELETE ON fixed_character_grades
FOR EACH ROW EXECUTE FUNCTION refuse_semester_closing_edit();--> statement-breakpoint
CREATE TRIGGER fixed_character_grades_cannot_be_emptied
BEFORE TRUNCATE ON fixed_character_grades
FOR EACH STATEMENT EXECUTE FUNCTION refuse_semester_closing_edit();