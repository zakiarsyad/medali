CREATE TABLE "stage_breakdowns" (
	"tahap" smallint NOT NULL,
	"value_key" text NOT NULL,
	"text" text NOT NULL,
	"activities" text[] NOT NULL,
	"indicator_codes" text[] NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL,
	CONSTRAINT "stage_breakdowns_tahap_value_key_pk" PRIMARY KEY("tahap","value_key"),
	CONSTRAINT "stage_breakdowns_tahap_1_to_4" CHECK ("stage_breakdowns"."tahap" between 1 and 4)
);
--> statement-breakpoint
ALTER TABLE "stage_breakdowns" ADD CONSTRAINT "stage_breakdowns_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;