CREATE TABLE "proof_file_keeping" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"keep_days" smallint NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	"set_by" uuid NOT NULL,
	CONSTRAINT "proof_file_keeping_one_row" CHECK ("proof_file_keeping"."id" = 1),
	CONSTRAINT "proof_file_keeping_days_in_range" CHECK ("proof_file_keeping"."keep_days" between 30 and 3650)
);
--> statement-breakpoint
ALTER TABLE "proof_file_keeping" ADD CONSTRAINT "proof_file_keeping_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;