CREATE TYPE "public"."counselling_shared_data" AS ENUM('counselling', 'summary');--> statement-breakpoint
CREATE TYPE "public"."counselling_sharing_recipient" AS ENUM('head_of_unit', 'director', 'head_of_program', 'mentor');--> statement-breakpoint
CREATE TYPE "public"."counselling_sharing_status" AS ENUM('waiting', 'approved', 'declined', 'published', 'cancelled', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."counselling_sharing_step" AS ENUM('ask', 'approve', 'record_paper', 'decline', 'publish', 'cancel', 'withdraw', 'consent_withdrawn');--> statement-breakpoint
CREATE TYPE "public"."counselling_sharing_way" AS ENUM('online', 'paper');--> statement-breakpoint
CREATE TABLE "counselling_sharing_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sharing_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"step" "counselling_sharing_step" NOT NULL,
	"status_before" "counselling_sharing_status",
	"status_after" "counselling_sharing_status" NOT NULL,
	"shared" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselling_sharings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "counselling_sharing_status" NOT NULL,
	"data" "counselling_shared_data"[] NOT NULL,
	"recipients" "counselling_sharing_recipient"[] NOT NULL,
	"summary" text,
	"way" "counselling_sharing_way",
	"asked_by" uuid NOT NULL,
	"asked_at" timestamp with time zone NOT NULL,
	"answered_at" timestamp with time zone,
	"published_by" uuid,
	"published_at" timestamp with time zone,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "counselling_sharings_some_data" CHECK (cardinality("counselling_sharings"."data") > 0),
	CONSTRAINT "counselling_sharings_some_recipient" CHECK (cardinality("counselling_sharings"."recipients") > 0),
	CONSTRAINT "counselling_sharings_summary_when_shared" CHECK (('summary' = any("counselling_sharings"."data")) = ("counselling_sharings"."summary" is not null)),
	CONSTRAINT "counselling_sharings_summary_length" CHECK (char_length(trim("counselling_sharings"."summary")) >= 10 and char_length("counselling_sharings"."summary") <= 1000),
	CONSTRAINT "counselling_sharings_way_once_approved" CHECK ("counselling_sharings"."status" not in ('approved', 'published') or "counselling_sharings"."way" is not null),
	CONSTRAINT "counselling_sharings_publisher_once_published" CHECK ("counselling_sharings"."status" <> 'published' or ("counselling_sharings"."published_at" is not null and "counselling_sharings"."published_by" is not null))
);
--> statement-breakpoint
ALTER TABLE "counselling_sharing_changes" ADD CONSTRAINT "counselling_sharing_changes_sharing_id_counselling_sharings_id_fk" FOREIGN KEY ("sharing_id") REFERENCES "public"."counselling_sharings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharing_changes" ADD CONSTRAINT "counselling_sharing_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharings" ADD CONSTRAINT "counselling_sharings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharings" ADD CONSTRAINT "counselling_sharings_asked_by_accounts_id_fk" FOREIGN KEY ("asked_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharings" ADD CONSTRAINT "counselling_sharings_published_by_accounts_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharings" ADD CONSTRAINT "counselling_sharings_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "counselling_sharing_changes_sharing" ON "counselling_sharing_changes" USING btree ("sharing_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "counselling_sharings_one_current" ON "counselling_sharings" USING btree ("student_id") WHERE "counselling_sharings"."status" in ('waiting', 'approved', 'published');--> statement-breakpoint
CREATE INDEX "counselling_sharings_student" ON "counselling_sharings" USING btree ("student_id","asked_at");