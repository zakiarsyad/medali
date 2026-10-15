CREATE TYPE "public"."dorm_warning_letter_change_action" AS ENUM('scheduled', 'issued');--> statement-breakpoint
CREATE TABLE "dorm_warning_letter_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"letter_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "dorm_warning_letter_change_action" NOT NULL,
	"call_day" date,
	"call_time" time,
	"call_place" text
);
--> statement-breakpoint
CREATE TABLE "dorm_warning_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"call_day" date,
	"call_time" time,
	"call_place" text,
	"result" text DEFAULT '' NOT NULL,
	"proposal_note" text DEFAULT '' NOT NULL,
	"issued_by" uuid,
	"issued_at" timestamp with time zone,
	CONSTRAINT "dorm_warning_letters_one_per_level_and_period" UNIQUE("student_id","period_id","level"),
	CONSTRAINT "dorm_warning_letters_level_1_or_2" CHECK ("dorm_warning_letters"."level" in (1, 2)),
	CONSTRAINT "dorm_warning_letters_call_is_whole" CHECK (("dorm_warning_letters"."call_day" is null) = ("dorm_warning_letters"."call_time" is null) and ("dorm_warning_letters"."call_day" is null) = ("dorm_warning_letters"."call_place" is null)),
	CONSTRAINT "dorm_warning_letters_call_place_length" CHECK (char_length("dorm_warning_letters"."call_place") between 3 and 100),
	CONSTRAINT "dorm_warning_letters_issue_is_whole" CHECK (("dorm_warning_letters"."issued_at" is null) = ("dorm_warning_letters"."issued_by" is null) and ("dorm_warning_letters"."issued_at" is null) = ("dorm_warning_letters"."result" = '')),
	CONSTRAINT "dorm_warning_letters_result_length" CHECK ("dorm_warning_letters"."result" = '' or char_length("dorm_warning_letters"."result") between 10 and 1000),
	CONSTRAINT "dorm_warning_letters_proposal_only_on_issued_sp2" CHECK ("dorm_warning_letters"."proposal_note" = '' or ("dorm_warning_letters"."level" = 2 and "dorm_warning_letters"."issued_at" is not null)),
	CONSTRAINT "dorm_warning_letters_proposal_note_length" CHECK (char_length("dorm_warning_letters"."proposal_note") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "dorm_warning_letter_changes" ADD CONSTRAINT "dorm_warning_letter_changes_letter_id_dorm_warning_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."dorm_warning_letters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_warning_letter_changes" ADD CONSTRAINT "dorm_warning_letter_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_issued_by_accounts_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_warning_letter_changes_letter" ON "dorm_warning_letter_changes" USING btree ("letter_id");--> statement-breakpoint
CREATE INDEX "dorm_warning_letters_period" ON "dorm_warning_letters" USING btree ("period_id");--> statement-breakpoint
-- Added by hand. A warning letter and its log are discipline records
-- that must always be trusted, so the database itself refuses to change
-- or delete a line of the log, and to change a letter once it is issued.
-- Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own. A letter is held by its
-- log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_dorm_warning_letter_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of dorm warning letters cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_warning_letter_changes_cannot_change
BEFORE UPDATE OR DELETE ON dorm_warning_letter_changes
FOR EACH ROW EXECUTE FUNCTION refuse_dorm_warning_letter_change_edit();--> statement-breakpoint
CREATE TRIGGER dorm_warning_letter_changes_cannot_be_emptied
BEFORE TRUNCATE ON dorm_warning_letter_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_dorm_warning_letter_change_edit();--> statement-breakpoint
CREATE FUNCTION refuse_issued_dorm_warning_letter_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'An issued dorm warning letter cannot be changed.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_warning_letters_issued_cannot_change
BEFORE UPDATE ON dorm_warning_letters
FOR EACH ROW WHEN (OLD.issued_at IS NOT NULL)
EXECUTE FUNCTION refuse_issued_dorm_warning_letter_edit();