CREATE TYPE "public"."sign_in_result" AS ENUM('signed_in', 'signed_out', 'refused_outside_campus', 'refused_no_account', 'failed');--> statement-breakpoint
CREATE TABLE "sign_in_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"happened_at" timestamp with time zone NOT NULL,
	"result" "sign_in_result" NOT NULL,
	"account_id" uuid
);
--> statement-breakpoint
ALTER TABLE "sign_in_log" ADD CONSTRAINT "sign_in_log_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Added by hand. The sign-in log is a record that must always be trusted,
-- so the database itself refuses to change or delete a line of it. Row
-- triggers do not see TRUNCATE, which would empty the log in one
-- statement, so that has a trigger of its own.
CREATE FUNCTION refuse_sign_in_log_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The sign-in log cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER sign_in_log_cannot_change
BEFORE UPDATE OR DELETE ON sign_in_log
FOR EACH ROW EXECUTE FUNCTION refuse_sign_in_log_edit();--> statement-breakpoint
CREATE TRIGGER sign_in_log_cannot_be_emptied
BEFORE TRUNCATE ON sign_in_log
FOR EACH STATEMENT EXECUTE FUNCTION refuse_sign_in_log_edit();
