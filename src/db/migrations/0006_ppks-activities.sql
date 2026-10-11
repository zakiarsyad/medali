CREATE TABLE "ppks_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semester" smallint NOT NULL,
	"name" text NOT NULL,
	"value_keys" text[] NOT NULL,
	"indicator_codes" text[] NOT NULL,
	"target_participants" integer,
	"is_required" boolean NOT NULL,
	"description" text NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "ppks_activities_semester_1_to_8" CHECK ("ppks_activities"."semester" between 1 and 8)
);
--> statement-breakpoint
ALTER TABLE "ppks_activities" ADD CONSTRAINT "ppks_activities_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppks_activities" ADD CONSTRAINT "ppks_activities_deleted_by_accounts_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;