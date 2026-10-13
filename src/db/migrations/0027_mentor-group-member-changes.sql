CREATE TABLE "mentor_group_member_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"group_before" uuid,
	"group_after" uuid,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_group_member_changes_group_differs" CHECK ("mentor_group_member_changes"."group_before" is distinct from "mentor_group_member_changes"."group_after")
);
--> statement-breakpoint
ALTER TABLE "mentor_group_member_changes" ADD CONSTRAINT "mentor_group_member_changes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_member_changes" ADD CONSTRAINT "mentor_group_member_changes_group_before_mentor_groups_id_fk" FOREIGN KEY ("group_before") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_member_changes" ADD CONSTRAINT "mentor_group_member_changes_group_after_mentor_groups_id_fk" FOREIGN KEY ("group_after") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_member_changes" ADD CONSTRAINT "mentor_group_member_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_group_member_changes_student" ON "mentor_group_member_changes" USING btree ("student_id");--> statement-breakpoint
-- Added by hand. The log of placements is a record that must always be
-- trusted, so the database itself refuses to change or delete a line of
-- it. Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own.
CREATE FUNCTION refuse_mentor_group_member_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of mentor group placements cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mentor_group_member_changes_cannot_change
BEFORE UPDATE OR DELETE ON mentor_group_member_changes
FOR EACH ROW EXECUTE FUNCTION refuse_mentor_group_member_change_edit();--> statement-breakpoint
CREATE TRIGGER mentor_group_member_changes_cannot_be_emptied
BEFORE TRUNCATE ON mentor_group_member_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mentor_group_member_change_edit();
