CREATE TYPE "public"."counselling_consent_status" AS ENUM('waiting', 'approved', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."counselling_consent_way" AS ENUM('online', 'paper');--> statement-breakpoint
CREATE TABLE "counselling_consent_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"status_before" "counselling_consent_status",
	"status_after" "counselling_consent_status" NOT NULL,
	"way" "counselling_consent_way",
	CONSTRAINT "counselling_consent_changes_way_only_when_approved" CHECK (("counselling_consent_changes"."status_after" = 'approved') = ("counselling_consent_changes"."way" is not null))
);
--> statement-breakpoint
CREATE TABLE "counselling_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "counselling_consent_status" NOT NULL,
	"way" "counselling_consent_way",
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "counselling_consents_one_per_student" UNIQUE("student_id"),
	CONSTRAINT "counselling_consents_way_only_when_approved" CHECK (("counselling_consents"."status" = 'approved') = ("counselling_consents"."way" is not null))
);
--> statement-breakpoint
ALTER TABLE "counselling_consent_changes" ADD CONSTRAINT "counselling_consent_changes_consent_id_counselling_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."counselling_consents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_consent_changes" ADD CONSTRAINT "counselling_consent_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_consents" ADD CONSTRAINT "counselling_consents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_consents" ADD CONSTRAINT "counselling_consents_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "counselling_consent_changes_consent" ON "counselling_consent_changes" USING btree ("consent_id");--> statement-breakpoint
-- Added by hand. The log of counselling consents is a record that must
-- always be trusted, so the database itself refuses to change or delete
-- a line of it. Row triggers do not see TRUNCATE, which would empty the
-- log in one statement, so that has a trigger of its own. A consent is
-- held by its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_counselling_consent_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of counselling consents cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER counselling_consent_changes_cannot_change
BEFORE UPDATE OR DELETE ON counselling_consent_changes
FOR EACH ROW EXECUTE FUNCTION refuse_counselling_consent_change_edit();--> statement-breakpoint
CREATE TRIGGER counselling_consent_changes_cannot_be_emptied
BEFORE TRUNCATE ON counselling_consent_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_counselling_consent_change_edit();
