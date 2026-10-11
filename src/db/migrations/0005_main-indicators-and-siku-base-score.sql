CREATE TABLE "main_indicators" (
	"code" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siku_base_score" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"score" smallint NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	"set_by" uuid NOT NULL,
	CONSTRAINT "siku_base_score_one_row" CHECK ("siku_base_score"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "main_indicators" ADD CONSTRAINT "main_indicators_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_base_score" ADD CONSTRAINT "siku_base_score_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;