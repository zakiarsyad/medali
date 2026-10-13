CREATE TABLE "activity_attendance_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_before" "activity_attendance_status",
	"note_before" text,
	"status_after" "activity_attendance_status" NOT NULL,
	"note_after" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_attendance_changes" ADD CONSTRAINT "activity_attendance_changes_attendance_id_activity_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."activity_attendances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attendance_changes" ADD CONSTRAINT "activity_attendance_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_attendance_changes_attendance" ON "activity_attendance_changes" USING btree ("attendance_id");--> statement-breakpoint
-- Added by hand. The log of attendance decisions is a record that must
-- always be trusted, because a decision changes a score, so the database
-- itself refuses to change or delete a line of it. Row triggers do not
-- see TRUNCATE, which would empty the log in one statement, so that has a
-- trigger of its own. An attendance is held by its log lines, so it
-- cannot be deleted either.
CREATE FUNCTION refuse_activity_attendance_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of attendance decisions cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER activity_attendance_changes_cannot_change
BEFORE UPDATE OR DELETE ON activity_attendance_changes
FOR EACH ROW EXECUTE FUNCTION refuse_activity_attendance_change_edit();--> statement-breakpoint
CREATE TRIGGER activity_attendance_changes_cannot_be_emptied
BEFORE TRUNCATE ON activity_attendance_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_activity_attendance_change_edit();