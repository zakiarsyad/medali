CREATE TYPE "public"."academic_period_change_action" AS ENUM('added', 'dates_changed');--> statement-breakpoint
CREATE TYPE "public"."academic_term" AS ENUM('odd', 'even');--> statement-breakpoint
CREATE TABLE "academic_period_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "academic_period_change_action" NOT NULL,
	"starts_on_before" date,
	"ends_on_before" date,
	"starts_on_after" date NOT NULL,
	"ends_on_after" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_year" smallint NOT NULL,
	"term" "academic_term" NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	CONSTRAINT "academic_periods_year_and_term" UNIQUE("start_year","term"),
	CONSTRAINT "academic_periods_ends_after_start" CHECK ("academic_periods"."ends_on" > "academic_periods"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "academic_period_changes" ADD CONSTRAINT "academic_period_changes_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_period_changes" ADD CONSTRAINT "academic_period_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;