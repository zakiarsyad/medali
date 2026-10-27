CREATE TABLE "mentoring_indicator_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"indicators" jsonb NOT NULL,
	"before" jsonb NOT NULL,
	"replaces" uuid,
	"set_by" uuid NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mentoring_indicator_sets_replaced_once" UNIQUE NULLS NOT DISTINCT("replaces"),
	CONSTRAINT "mentoring_indicator_sets_six" CHECK (jsonb_typeof("mentoring_indicator_sets"."indicators") = 'array' and jsonb_array_length("mentoring_indicator_sets"."indicators") = 6 and jsonb_typeof("mentoring_indicator_sets"."before") = 'array' and jsonb_array_length("mentoring_indicator_sets"."before") = 6)
);
--> statement-breakpoint
ALTER TABLE "mentoring_indicator_sets" ADD CONSTRAINT "mentoring_indicator_sets_replaces_mentoring_indicator_sets_id_fk" FOREIGN KEY ("replaces") REFERENCES "public"."mentoring_indicator_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_indicator_sets" ADD CONSTRAINT "mentoring_indicator_sets_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentoring_indicator_sets_set_at" ON "mentoring_indicator_sets" USING btree ("set_at");--> statement-breakpoint
-- Added by hand. The settings of the mentoring score indicators are the
-- log of a score rule, which must always be trusted, so the database
-- itself refuses to change or delete one. Row triggers do not see
-- TRUNCATE, which would empty the log in one statement, so that has a
-- trigger of its own.
CREATE FUNCTION refuse_mentoring_indicator_set_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The settings of the mentoring score indicators cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mentoring_indicator_sets_cannot_change
BEFORE UPDATE OR DELETE ON mentoring_indicator_sets
FOR EACH ROW EXECUTE FUNCTION refuse_mentoring_indicator_set_edit();--> statement-breakpoint
CREATE TRIGGER mentoring_indicator_sets_cannot_be_emptied
BEFORE TRUNCATE ON mentoring_indicator_sets
FOR EACH STATEMENT EXECUTE FUNCTION refuse_mentoring_indicator_set_edit();
