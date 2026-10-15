CREATE TYPE "public"."dorm_violation_change_action" AS ENUM('entered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."dorm_violation_punishment" AS ENUM('direct_action', 'warning', 'tks', 'other');--> statement-breakpoint
CREATE TABLE "dorm_violation_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"violation_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "dorm_violation_change_action" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_violations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"dorm" "dorm" NOT NULL,
	"day" date NOT NULL,
	"reason" text NOT NULL,
	"punishment" "dorm_violation_punishment" NOT NULL,
	"other_punishment" text DEFAULT '' NOT NULL,
	"announced_at" timestamp with time zone NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "dorm_violations_reason_length" CHECK (char_length("dorm_violations"."reason") between 3 and 200),
	CONSTRAINT "dorm_violations_other_punishment_only_for_other" CHECK (("dorm_violations"."punishment" = 'other') = ("dorm_violations"."other_punishment" <> '')),
	CONSTRAINT "dorm_violations_other_punishment_length" CHECK (char_length("dorm_violations"."other_punishment") <= 100),
	CONSTRAINT "dorm_violations_announced_from_its_day" CHECK (("dorm_violations"."announced_at" at time zone 'Asia/Jakarta')::date >= "dorm_violations"."day"),
	CONSTRAINT "dorm_violations_entered_from_its_day" CHECK (("dorm_violations"."entered_at" at time zone 'Asia/Jakarta')::date >= "dorm_violations"."day"),
	CONSTRAINT "dorm_violations_cancel_is_whole" CHECK (("dorm_violations"."cancelled_by" is null) = ("dorm_violations"."cancelled_at" is null)),
	CONSTRAINT "dorm_violations_cancelled_before_announced" CHECK ("dorm_violations"."cancelled_at" is null or "dorm_violations"."cancelled_at" < "dorm_violations"."announced_at")
);
--> statement-breakpoint
ALTER TABLE "dorm_violation_changes" ADD CONSTRAINT "dorm_violation_changes_violation_id_dorm_violations_id_fk" FOREIGN KEY ("violation_id") REFERENCES "public"."dorm_violations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_violation_changes" ADD CONSTRAINT "dorm_violation_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_cancelled_by_accounts_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_violation_changes_violation" ON "dorm_violation_changes" USING btree ("violation_id");--> statement-breakpoint
CREATE INDEX "dorm_violations_batch" ON "dorm_violations" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "dorm_violations_student" ON "dorm_violations" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "dorm_violations_day" ON "dorm_violations" USING btree ("day");--> statement-breakpoint
CREATE INDEX "dorm_violations_announced" ON "dorm_violations" USING btree ("announced_at") WHERE "dorm_violations"."cancelled_at" is null;--> statement-breakpoint
-- Added by hand. The log of dorm violations is a discipline record that
-- must always be trusted, so the database itself refuses to change or
-- delete a line of it. Row triggers do not see TRUNCATE, which would
-- empty the log in one statement, so that has a trigger of its own. A
-- violation is held by its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_dorm_violation_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of dorm violations cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER dorm_violation_changes_cannot_change
BEFORE UPDATE OR DELETE ON dorm_violation_changes
FOR EACH ROW EXECUTE FUNCTION refuse_dorm_violation_change_edit();--> statement-breakpoint
CREATE TRIGGER dorm_violation_changes_cannot_be_emptied
BEFORE TRUNCATE ON dorm_violation_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_dorm_violation_change_edit();
