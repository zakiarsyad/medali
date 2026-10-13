CREATE TYPE "public"."upload_unit" AS ENUM('day', 'week');--> statement-breakpoint
CREATE TABLE "activity_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"academic_period_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"upload_count" smallint NOT NULL,
	"upload_unit" "upload_unit" NOT NULL,
	"location" text NOT NULL,
	"is_required" boolean NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "activity_schedules_ends_on_or_after_start" CHECK ("activity_schedules"."ends_on" >= "activity_schedules"."starts_on"),
	CONSTRAINT "activity_schedules_end_time_after_start" CHECK ("activity_schedules"."end_time" > "activity_schedules"."start_time"),
	CONSTRAINT "activity_schedules_upload_count_0_to_52" CHECK ("activity_schedules"."upload_count" between 0 and 52)
);
--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_activity_id_ppks_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ppks_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_deleted_by_accounts_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;