CREATE TYPE "public"."email_change_action" AS ENUM('added', 'changed', 'cleared');--> statement-breakpoint
CREATE TABLE "email_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "email_change_action" NOT NULL,
	"email_before" text,
	"email_after" text
);
--> statement-breakpoint
ALTER TABLE "email_changes" ADD CONSTRAINT "email_changes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_changes" ADD CONSTRAINT "email_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Added by hand. The address change log is a record that must always be
-- trusted, so the database itself refuses to change or delete a line of
-- it. Row triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own.
CREATE FUNCTION refuse_email_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The address change log cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER email_changes_cannot_change
BEFORE UPDATE OR DELETE ON email_changes
FOR EACH ROW EXECUTE FUNCTION refuse_email_change_edit();--> statement-breakpoint
CREATE TRIGGER email_changes_cannot_be_emptied
BEFORE TRUNCATE ON email_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_email_change_edit();