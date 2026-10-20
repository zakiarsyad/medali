CREATE TYPE "public"."violation_note_change_action" AS ENUM('added', 'removed');--> statement-breakpoint
CREATE TYPE "public"."violation_note_punishment" AS ENUM('direct_guidance', 'warning', 'other');--> statement-breakpoint
CREATE TABLE "violation_note_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"action" "violation_note_change_action" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "violation_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"day" date NOT NULL,
	"description" text NOT NULL,
	"punishment" "violation_note_punishment" NOT NULL,
	"other_punishment" text DEFAULT '' NOT NULL,
	"remark" text DEFAULT '' NOT NULL,
	"saved_by" uuid NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	"removed_by" uuid,
	"removed_at" timestamp with time zone,
	CONSTRAINT "violation_notes_description_length" CHECK (char_length("violation_notes"."description") between 5 and 300),
	CONSTRAINT "violation_notes_other_punishment_only_for_other" CHECK (("violation_notes"."punishment" = 'other') = ("violation_notes"."other_punishment" <> '')),
	CONSTRAINT "violation_notes_other_punishment_length" CHECK (char_length("violation_notes"."other_punishment") <= 100),
	CONSTRAINT "violation_notes_remark_length" CHECK (char_length("violation_notes"."remark") <= 500),
	CONSTRAINT "violation_notes_saved_from_its_day" CHECK (("violation_notes"."saved_at" at time zone 'Asia/Jakarta')::date >= "violation_notes"."day"),
	CONSTRAINT "violation_notes_removal_is_whole" CHECK (("violation_notes"."removed_by" is null) = ("violation_notes"."removed_at" is null)),
	CONSTRAINT "violation_notes_removed_after_saved" CHECK ("violation_notes"."removed_at" is null or "violation_notes"."removed_at" >= "violation_notes"."saved_at")
);
--> statement-breakpoint
ALTER TABLE "violation_note_changes" ADD CONSTRAINT "violation_note_changes_note_id_violation_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."violation_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violation_note_changes" ADD CONSTRAINT "violation_note_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violation_notes" ADD CONSTRAINT "violation_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violation_notes" ADD CONSTRAINT "violation_notes_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violation_notes" ADD CONSTRAINT "violation_notes_removed_by_accounts_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "violation_note_changes_note" ON "violation_note_changes" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "violation_notes_student" ON "violation_notes" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "violation_notes_day" ON "violation_notes" USING btree ("day");--> statement-breakpoint
-- Added by hand. The log of violation notes must always be trusted, so
-- the database itself refuses to change or delete a line of it. A note
-- is never changed but for its removal, a mark set once, and never
-- deleted. Row triggers do not see TRUNCATE, which would empty a table
-- in one statement, so that has a trigger of its own.
CREATE FUNCTION refuse_violation_note_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of violation notes cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER violation_note_changes_cannot_change
BEFORE UPDATE OR DELETE ON violation_note_changes
FOR EACH ROW EXECUTE FUNCTION refuse_violation_note_change_edit();--> statement-breakpoint
CREATE TRIGGER violation_note_changes_cannot_be_emptied
BEFORE TRUNCATE ON violation_note_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_violation_note_change_edit();--> statement-breakpoint
CREATE FUNCTION refuse_violation_note_removal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A violation note cannot be deleted; mark it removed instead.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER violation_notes_cannot_be_deleted
BEFORE DELETE ON violation_notes
FOR EACH ROW EXECUTE FUNCTION refuse_violation_note_removal();--> statement-breakpoint
CREATE TRIGGER violation_notes_cannot_be_emptied
BEFORE TRUNCATE ON violation_notes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_violation_note_removal();--> statement-breakpoint
CREATE FUNCTION refuse_violation_note_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.removed_at IS NULL
    AND (NEW.id, NEW.student_id, NEW.day, NEW.description, NEW.punishment,
         NEW.other_punishment, NEW.remark, NEW.saved_by, NEW.saved_at)
      IS NOT DISTINCT FROM
        (OLD.id, OLD.student_id, OLD.day, OLD.description, OLD.punishment,
         OLD.other_punishment, OLD.remark, OLD.saved_by, OLD.saved_at)
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'A violation note cannot be changed; only marked removed, once.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER violation_notes_only_removed
BEFORE UPDATE ON violation_notes
FOR EACH ROW EXECUTE FUNCTION refuse_violation_note_edit();
