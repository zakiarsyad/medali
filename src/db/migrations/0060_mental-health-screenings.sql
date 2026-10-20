CREATE TYPE "public"."mental_health_instrument" AS ENUM('dass21', 'srq20');--> statement-breakpoint
CREATE TYPE "public"."mental_health_level" AS ENUM('normal', 'mild', 'moderate', 'severe', 'extremely_severe');--> statement-breakpoint
CREATE TYPE "public"."mental_health_screening_event" AS ENUM('saved', 'opened');--> statement-breakpoint
CREATE TABLE "mental_health_screening_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"event" "mental_health_screening_event" NOT NULL,
	"by" uuid NOT NULL,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mental_health_screenings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"screened_on" date NOT NULL,
	"instrument" "mental_health_instrument" NOT NULL,
	"depression" smallint,
	"anxiety" smallint,
	"stress" smallint,
	"srq_yes" smallint,
	"self_harm" boolean NOT NULL,
	"level" "mental_health_level" NOT NULL,
	"note" text NOT NULL,
	"saved_by" uuid NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mental_health_screenings_scores" CHECK (case "mental_health_screenings"."instrument"
        when 'dass21' then "mental_health_screenings"."srq_yes" is null
          and ("mental_health_screenings"."depression" is not null and "mental_health_screenings"."depression" between 0 and 21)
          and ("mental_health_screenings"."anxiety" is not null and "mental_health_screenings"."anxiety" between 0 and 21)
          and ("mental_health_screenings"."stress" is not null and "mental_health_screenings"."stress" between 0 and 21)
        else "mental_health_screenings"."depression" is null and "mental_health_screenings"."anxiety" is null
          and "mental_health_screenings"."stress" is null
          and ("mental_health_screenings"."srq_yes" is not null and "mental_health_screenings"."srq_yes" between 0 and 20)
      end),
	CONSTRAINT "mental_health_screenings_self_harm_most_severe" CHECK (not "mental_health_screenings"."self_harm" or "mental_health_screenings"."level" = 'extremely_severe'),
	CONSTRAINT "mental_health_screenings_note_length" CHECK (char_length("mental_health_screenings"."note") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "mental_health_screening_log" ADD CONSTRAINT "mental_health_screening_log_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_screening_log" ADD CONSTRAINT "mental_health_screening_log_by_accounts_id_fk" FOREIGN KEY ("by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_screenings" ADD CONSTRAINT "mental_health_screenings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_screenings" ADD CONSTRAINT "mental_health_screenings_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mental_health_screening_log_student" ON "mental_health_screening_log" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "mental_health_screenings_student" ON "mental_health_screenings" USING btree ("student_id","screened_on");--> statement-breakpoint
-- Added by hand. A screening is never corrected or erased: a new one is
-- added instead. Its log must always be trusted. So the database itself
-- refuses to change or delete a row of either table. Row triggers do not
-- see TRUNCATE, which would empty a table in one statement, so that has
-- a trigger of its own.
CREATE FUNCTION refuse_mental_health_screening_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Mental health screenings and their log cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mental_health_screenings_cannot_change
BEFORE UPDATE OR DELETE ON mental_health_screenings
FOR EACH ROW EXECUTE FUNCTION refuse_mental_health_screening_edit();--> statement-breakpoint
CREATE TRIGGER mental_health_screenings_cannot_be_emptied
BEFORE TRUNCATE ON mental_health_screenings
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mental_health_screening_edit();--> statement-breakpoint
CREATE TRIGGER mental_health_screening_log_cannot_change
BEFORE UPDATE OR DELETE ON mental_health_screening_log
FOR EACH ROW EXECUTE FUNCTION refuse_mental_health_screening_edit();--> statement-breakpoint
CREATE TRIGGER mental_health_screening_log_cannot_be_emptied
BEFORE TRUNCATE ON mental_health_screening_log
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mental_health_screening_edit();
