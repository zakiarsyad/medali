CREATE TYPE "public"."mentor_replacement_reason" AS ENUM('poor_evaluation', 'transfer', 'retirement', 'study_leave', 'own_request', 'other');--> statement-breakpoint
CREATE TYPE "public"."old_mentor_status" AS ENUM('reserve', 'inactive');--> statement-breakpoint
CREATE TABLE "mentor_replacements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"old_mentor_id" uuid NOT NULL,
	"new_mentor_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"reason" "mentor_replacement_reason" NOT NULL,
	"letter_number" text NOT NULL,
	"old_mentor_status" "old_mentor_status" NOT NULL,
	"note" text,
	"set_by" uuid NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	"carried_out_at" timestamp with time zone,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "mentor_replacements_cancelled_with_who_and_when" CHECK (("mentor_replacements"."cancelled_at" is null) = ("mentor_replacements"."cancelled_by" is null)),
	CONSTRAINT "mentor_replacements_not_carried_out_and_cancelled" CHECK ("mentor_replacements"."carried_out_at" is null or "mentor_replacements"."cancelled_at" is null),
	CONSTRAINT "mentor_replacements_two_mentors" CHECK ("mentor_replacements"."old_mentor_id" <> "mentor_replacements"."new_mentor_id"),
	CONSTRAINT "mentor_replacements_letter_number_given" CHECK (btrim("mentor_replacements"."letter_number") <> '')
);
--> statement-breakpoint
ALTER TABLE "mentor_replacements" ADD CONSTRAINT "mentor_replacements_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_replacements" ADD CONSTRAINT "mentor_replacements_old_mentor_id_accounts_id_fk" FOREIGN KEY ("old_mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_replacements" ADD CONSTRAINT "mentor_replacements_new_mentor_id_accounts_id_fk" FOREIGN KEY ("new_mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_replacements" ADD CONSTRAINT "mentor_replacements_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_replacements" ADD CONSTRAINT "mentor_replacements_cancelled_by_accounts_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_replacements_one_waiting_per_group" ON "mentor_replacements" USING btree ("group_id") WHERE "mentor_replacements"."carried_out_at" is null and "mentor_replacements"."cancelled_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_replacements_one_waiting_per_new_mentor" ON "mentor_replacements" USING btree ("new_mentor_id") WHERE "mentor_replacements"."carried_out_at" is null and "mentor_replacements"."cancelled_at" is null;--> statement-breakpoint
CREATE INDEX "mentor_replacements_old_mentor" ON "mentor_replacements" USING btree ("old_mentor_id");--> statement-breakpoint
-- Added by hand. A replacement is the record of who gave a group another
-- mentor and when, and a cancelled one stays as it is, so the database
-- itself refuses to delete one. Row triggers do not see TRUNCATE, which
-- would empty the table in one statement, so that has a trigger of its
-- own.
CREATE FUNCTION refuse_mentor_replacement_removal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A mentor replacement cannot be deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mentor_replacements_cannot_be_deleted
BEFORE DELETE ON mentor_replacements
FOR EACH ROW EXECUTE FUNCTION refuse_mentor_replacement_removal();--> statement-breakpoint
CREATE TRIGGER mentor_replacements_cannot_be_emptied
BEFORE TRUNCATE ON mentor_replacements
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mentor_replacement_removal();