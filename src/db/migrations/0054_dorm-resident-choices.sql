CREATE TABLE "dorm_resident_choice_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"dorm_before" "dorm",
	"dorm_after" "dorm",
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "dorm_resident_choice_changes_dorm_differs" CHECK ("dorm_resident_choice_changes"."dorm_before" is distinct from "dorm_resident_choice_changes"."dorm_after")
);
--> statement-breakpoint
CREATE TABLE "dorm_resident_choices" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"dorm" "dorm",
	"note" text,
	"set_by" uuid NOT NULL,
	"set_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dorm_resident_choice_changes" ADD CONSTRAINT "dorm_resident_choice_changes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_resident_choice_changes" ADD CONSTRAINT "dorm_resident_choice_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_resident_choices" ADD CONSTRAINT "dorm_resident_choices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_resident_choices" ADD CONSTRAINT "dorm_resident_choices_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_resident_choice_changes_student" ON "dorm_resident_choice_changes" USING btree ("student_id");--> statement-breakpoint
-- Added by hand. The log of where students were made to live by hand must
-- always be trusted, so the database itself refuses to change or delete a
-- line. Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own.
CREATE FUNCTION refuse_dorm_resident_choice_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of dorm residents set by hand cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_resident_choice_changes_cannot_change
BEFORE UPDATE OR DELETE ON dorm_resident_choice_changes
FOR EACH ROW EXECUTE FUNCTION refuse_dorm_resident_choice_change_edit();--> statement-breakpoint
CREATE TRIGGER dorm_resident_choice_changes_cannot_be_emptied
BEFORE TRUNCATE ON dorm_resident_choice_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_dorm_resident_choice_change_edit();
