CREATE TYPE "public"."dorm_activity_audience" AS ENUM('all', 'men', 'women', 'wismantara_putra', 'wismantara_putri', 'dana_rakca', 'cipta_bakti');--> statement-breakpoint
CREATE TYPE "public"."dorm_activity_category" AS ENUM('roll_call', 'worship', 'sport', 'cleaning', 'character_building', 'study_together', 'arts_and_culture', 'other');--> statement-breakpoint
CREATE TYPE "public"."dorm_activity_organiser" AS ENUM('upk', 'coach', 'bam');--> statement-breakpoint
CREATE TYPE "public"."dorm_activity_pattern" AS ENUM('once', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "dorm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid NOT NULL,
	"removed_from" date,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "dorm_activities_removal_mark_is_whole" CHECK (("dorm_activities"."deleted_at" is null) = ("dorm_activities"."deleted_by" is null) and ("dorm_activities"."deleted_at" is null) = ("dorm_activities"."removed_from" is null))
);
--> statement-breakpoint
CREATE TABLE "dorm_activity_days_off" (
	"activity_id" uuid NOT NULL,
	"day" date NOT NULL,
	CONSTRAINT "dorm_activity_days_off_activity_id_day_pk" PRIMARY KEY("activity_id","day")
);
--> statement-breakpoint
CREATE TABLE "dorm_activity_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"shown_from" date,
	"shown_until" date,
	"name" text NOT NULL,
	"category" "dorm_activity_category" NOT NULL,
	"location" text NOT NULL,
	"pattern" "dorm_activity_pattern" NOT NULL,
	"weekdays" smallint[] NOT NULL,
	"month_day" smallint,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"organiser" "dorm_activity_organiser" NOT NULL,
	"organiser_name" text NOT NULL,
	"audience" "dorm_activity_audience" NOT NULL,
	"is_required" boolean NOT NULL,
	"rundown" jsonb NOT NULL,
	CONSTRAINT "dorm_activity_versions_shown_until_on_or_after_from" CHECK ("dorm_activity_versions"."shown_until" >= "dorm_activity_versions"."shown_from"),
	CONSTRAINT "dorm_activity_versions_ends_on_or_after_start" CHECK ("dorm_activity_versions"."ends_on" >= "dorm_activity_versions"."starts_on"),
	CONSTRAINT "dorm_activity_versions_end_time_after_start" CHECK ("dorm_activity_versions"."end_time" > "dorm_activity_versions"."start_time"),
	CONSTRAINT "dorm_activity_versions_once_is_one_day" CHECK ("dorm_activity_versions"."pattern" <> 'once' or "dorm_activity_versions"."ends_on" is not distinct from "dorm_activity_versions"."starts_on"),
	CONSTRAINT "dorm_activity_versions_weekly_has_weekdays" CHECK (("dorm_activity_versions"."pattern" = 'weekly') = (cardinality("dorm_activity_versions"."weekdays") > 0)),
	CONSTRAINT "dorm_activity_versions_weekdays_0_to_6" CHECK ("dorm_activity_versions"."weekdays" <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
	CONSTRAINT "dorm_activity_versions_monthly_has_month_day" CHECK (("dorm_activity_versions"."pattern" = 'monthly') = ("dorm_activity_versions"."month_day" is not null)),
	CONSTRAINT "dorm_activity_versions_month_day_in_range" CHECK ("dorm_activity_versions"."month_day" between 1 and 28)
);
--> statement-breakpoint
ALTER TABLE "dorm_activities" ADD CONSTRAINT "dorm_activities_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_activities" ADD CONSTRAINT "dorm_activities_deleted_by_accounts_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_activity_days_off" ADD CONSTRAINT "dorm_activity_days_off_activity_id_dorm_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."dorm_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_activity_versions" ADD CONSTRAINT "dorm_activity_versions_activity_id_dorm_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."dorm_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_activity_versions_one_without_last_day" ON "dorm_activity_versions" USING btree ("activity_id") WHERE "dorm_activity_versions"."shown_until" is null;--> statement-breakpoint
CREATE INDEX "dorm_activity_versions_activity" ON "dorm_activity_versions" USING btree ("activity_id");