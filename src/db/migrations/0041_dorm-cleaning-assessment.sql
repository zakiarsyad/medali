CREATE TYPE "public"."dorm_cleaning_result" AS ENUM('met', 'not_met');--> statement-breakpoint
CREATE TYPE "public"."dorm_cleaning_status" AS ENUM('scheduled', 'judged', 'validated');--> statement-breakpoint
CREATE TYPE "public"."dorm_cleaning_step" AS ENUM('judged', 'sent_back', 'validated');--> statement-breakpoint
CREATE TABLE "dorm_cleaning_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duty_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"step" "dorm_cleaning_step" NOT NULL,
	"result" "dorm_cleaning_result" NOT NULL,
	"note" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "repeat_of" uuid;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "status" "dorm_cleaning_status" DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "result" "dorm_cleaning_result";--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "judge_note" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "judged_by" uuid;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "judged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "sent_back_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "sent_back_by" uuid;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "sent_back_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "validated_by" uuid;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD COLUMN "validated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_changes" ADD CONSTRAINT "dorm_cleaning_changes_duty_id_dorm_cleaning_duties_id_fk" FOREIGN KEY ("duty_id") REFERENCES "public"."dorm_cleaning_duties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_changes" ADD CONSTRAINT "dorm_cleaning_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_cleaning_changes_duty" ON "dorm_cleaning_changes" USING btree ("duty_id");--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_repeat_of_dorm_cleaning_duties_id_fk" FOREIGN KEY ("repeat_of") REFERENCES "public"."dorm_cleaning_duties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_judged_by_accounts_id_fk" FOREIGN KEY ("judged_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_sent_back_by_accounts_id_fk" FOREIGN KEY ("sent_back_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_validated_by_accounts_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_cleaning_duties_one_repeat" ON "dorm_cleaning_duties" USING btree ("repeat_of") WHERE "dorm_cleaning_duties"."repeat_of" is not null;--> statement-breakpoint
CREATE INDEX "dorm_cleaning_duties_waiting" ON "dorm_cleaning_duties" USING btree ("dorm") WHERE "dorm_cleaning_duties"."status" = 'judged' or ("dorm_cleaning_duties"."status" = 'scheduled' and "dorm_cleaning_duties"."repeat_of" is not null);--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_judged_unless_scheduled" CHECK (("dorm_cleaning_duties"."status" = 'scheduled') = ("dorm_cleaning_duties"."result" is null) and ("dorm_cleaning_duties"."result" is null) = ("dorm_cleaning_duties"."judged_at" is null) and ("dorm_cleaning_duties"."judged_at" is null) = ("dorm_cleaning_duties"."judged_by" is null));--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_validated_when_validated" CHECK (("dorm_cleaning_duties"."status" = 'validated') = ("dorm_cleaning_duties"."validated_at" is not null) and ("dorm_cleaning_duties"."validated_at" is null) = ("dorm_cleaning_duties"."validated_by" is null));--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_not_met_has_note" CHECK ("dorm_cleaning_duties"."result" is distinct from 'not_met' or "dorm_cleaning_duties"."judge_note" <> '');--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_sent_back_is_whole" CHECK (("dorm_cleaning_duties"."sent_back_at" is null) = ("dorm_cleaning_duties"."sent_back_by" is null) and ("dorm_cleaning_duties"."sent_back_at" is null) = ("dorm_cleaning_duties"."sent_back_reason" = ''));--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_judge_note_length" CHECK (char_length("dorm_cleaning_duties"."judge_note") <= 200);--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_sent_back_reason_length" CHECK (char_length("dorm_cleaning_duties"."sent_back_reason") <= 200);--> statement-breakpoint
-- Added by hand. The log of judgements, sendings back and validations of
-- cleaning duties is a record that must always be trusted, because a
-- validation gives a room its +1 or −1, so the database itself refuses to
-- change or delete a line of it. Row triggers do not see TRUNCATE, which
-- would empty the log in one statement, so that has a trigger of its own.
-- A duty is held by its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_dorm_cleaning_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of dorm cleaning judgements cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_cleaning_changes_cannot_change
BEFORE UPDATE OR DELETE ON dorm_cleaning_changes
FOR EACH ROW EXECUTE FUNCTION refuse_dorm_cleaning_change_edit();--> statement-breakpoint
CREATE TRIGGER dorm_cleaning_changes_cannot_be_emptied
BEFORE TRUNCATE ON dorm_cleaning_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_dorm_cleaning_change_edit();