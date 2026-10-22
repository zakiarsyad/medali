CREATE TYPE "public"."coaching_status" AS ENUM('identified', 'counselling', 'monitoring', 'done');--> statement-breakpoint
CREATE TABLE "coaching_status_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"status_before" "coaching_status" NOT NULL,
	"note_before" text NOT NULL,
	"status_after" "coaching_status" NOT NULL,
	"note_after" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "coaching_status_changes_note_length" CHECK (char_length("coaching_status_changes"."note_before") <= 300 and char_length("coaching_status_changes"."note_after") <= 300),
	CONSTRAINT "coaching_status_changes_differs" CHECK (("coaching_status_changes"."status_before", "coaching_status_changes"."note_before") is distinct from ("coaching_status_changes"."status_after", "coaching_status_changes"."note_after"))
);
--> statement-breakpoint
CREATE TABLE "coaching_statuses" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"status" "coaching_status" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "coaching_statuses_note_length" CHECK (char_length("coaching_statuses"."note") <= 300),
	CONSTRAINT "coaching_statuses_version" CHECK ("coaching_statuses"."version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "coaching_status_changes" ADD CONSTRAINT "coaching_status_changes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_status_changes" ADD CONSTRAINT "coaching_status_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_statuses" ADD CONSTRAINT "coaching_statuses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_statuses" ADD CONSTRAINT "coaching_statuses_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coaching_status_changes_student" ON "coaching_status_changes" USING btree ("student_id","changed_at");--> statement-breakpoint
-- Added by hand. The log of coaching statuses must always be trusted, so
-- the database itself refuses to change or delete a line of it, and a
-- status is never deleted: it is only moved to another one. Row triggers
-- do not see TRUNCATE, which would empty a table in one statement, so
-- that has a trigger of its own.
CREATE FUNCTION refuse_coaching_status_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of coaching statuses cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER coaching_status_changes_cannot_change
BEFORE UPDATE OR DELETE ON coaching_status_changes
FOR EACH ROW EXECUTE FUNCTION refuse_coaching_status_change_edit();--> statement-breakpoint
CREATE TRIGGER coaching_status_changes_cannot_be_emptied
BEFORE TRUNCATE ON coaching_status_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_coaching_status_change_edit();--> statement-breakpoint
CREATE FUNCTION refuse_coaching_status_removal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A coaching status cannot be deleted; move it to another status instead.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER coaching_statuses_cannot_be_deleted
BEFORE DELETE ON coaching_statuses
FOR EACH ROW EXECUTE FUNCTION refuse_coaching_status_removal();--> statement-breakpoint
CREATE TRIGGER coaching_statuses_cannot_be_emptied
BEFORE TRUNCATE ON coaching_statuses
FOR EACH STATEMENT EXECUTE FUNCTION refuse_coaching_status_removal();