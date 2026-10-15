CREATE TYPE "public"."grade_letter" AS ENUM('A', 'B', 'C', 'D', 'E');--> statement-breakpoint
CREATE TABLE "character_grade_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_weight" smallint NOT NULL,
	"mentoring_weight" smallint NOT NULL,
	"siku_weight" smallint NOT NULL,
	"skpm_weight" smallint NOT NULL,
	"a_from" smallint NOT NULL,
	"b_from" smallint NOT NULL,
	"c_from" smallint NOT NULL,
	"d_from" smallint NOT NULL,
	"pass_letter" "grade_letter" NOT NULL,
	"before" jsonb NOT NULL,
	"replaces" uuid,
	"set_by" uuid NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	CONSTRAINT "character_grade_schemes_replaced_once" UNIQUE NULLS NOT DISTINCT("replaces"),
	CONSTRAINT "character_grade_schemes_in_range" CHECK ("character_grade_schemes"."attendance_weight" between 0 and 100 and "character_grade_schemes"."mentoring_weight" between 0 and 100 and "character_grade_schemes"."siku_weight" between 0 and 100 and "character_grade_schemes"."skpm_weight" between 0 and 100 and "character_grade_schemes"."a_from" between 0 and 100 and "character_grade_schemes"."b_from" between 0 and 100 and "character_grade_schemes"."c_from" between 0 and 100 and "character_grade_schemes"."d_from" between 0 and 100),
	CONSTRAINT "character_grade_schemes_weights_total" CHECK ("character_grade_schemes"."attendance_weight" + "character_grade_schemes"."mentoring_weight" + "character_grade_schemes"."siku_weight" + "character_grade_schemes"."skpm_weight" = 100),
	CONSTRAINT "character_grade_schemes_limits_go_down" CHECK ("character_grade_schemes"."a_from" > "character_grade_schemes"."b_from" and "character_grade_schemes"."b_from" > "character_grade_schemes"."c_from" and "character_grade_schemes"."c_from" > "character_grade_schemes"."d_from")
);
--> statement-breakpoint
ALTER TABLE "character_grade_schemes" ADD CONSTRAINT "character_grade_schemes_replaces_character_grade_schemes_id_fk" FOREIGN KEY ("replaces") REFERENCES "public"."character_grade_schemes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_grade_schemes" ADD CONSTRAINT "character_grade_schemes_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_grade_schemes_set_at" ON "character_grade_schemes" USING btree ("set_at");--> statement-breakpoint
-- Added by hand. The settings of the character grade scheme are the log
-- of a score rule, which must always be trusted, so the database itself
-- refuses to change or delete one. Row triggers do not see TRUNCATE,
-- which would empty the log in one statement, so that has a trigger of
-- its own.
CREATE FUNCTION refuse_grade_scheme_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The settings of the character grade scheme cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER character_grade_schemes_cannot_change
BEFORE UPDATE OR DELETE ON character_grade_schemes
FOR EACH ROW EXECUTE FUNCTION refuse_grade_scheme_edit();--> statement-breakpoint
CREATE TRIGGER character_grade_schemes_cannot_be_emptied
BEFORE TRUNCATE ON character_grade_schemes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_grade_scheme_edit();
