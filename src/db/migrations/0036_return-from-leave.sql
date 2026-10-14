CREATE TYPE "public"."dorm_return_report_status" AS ENUM('waiting', 'verified', 'rejected', 'validated');--> statement-breakpoint
ALTER TYPE "public"."dorm_leave_status" ADD VALUE 'completed';--> statement-breakpoint
CREATE TABLE "dorm_return_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"leave_id" uuid NOT NULL,
	"photo_key" text,
	"sent_at" timestamp with time zone NOT NULL,
	"status" "dorm_return_report_status" DEFAULT 'waiting' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"verify_note" text DEFAULT '' NOT NULL,
	"validated_by" uuid,
	"validated_at" timestamp with time zone,
	"validate_note" text DEFAULT '' NOT NULL,
	CONSTRAINT "dorm_return_reports_photoKey_unique" UNIQUE("photo_key"),
	CONSTRAINT "dorm_return_reports_verified_unless_waiting" CHECK (("dorm_return_reports"."status" = 'waiting') = ("dorm_return_reports"."verified_at" is null) and ("dorm_return_reports"."verified_at" is null) = ("dorm_return_reports"."verified_by" is null)),
	CONSTRAINT "dorm_return_reports_validated_when_validated" CHECK (("dorm_return_reports"."status" = 'validated' or "dorm_return_reports"."validated_at" is null or "dorm_return_reports"."status" = 'rejected') and ("dorm_return_reports"."status" <> 'validated' or "dorm_return_reports"."validated_at" is not null) and ("dorm_return_reports"."validated_at" is null) = ("dorm_return_reports"."validated_by" is null)),
	CONSTRAINT "dorm_return_reports_rejected_has_note" CHECK ("dorm_return_reports"."status" <> 'rejected' or "dorm_return_reports"."verify_note" <> '' or "dorm_return_reports"."validate_note" <> ''),
	CONSTRAINT "dorm_return_reports_verify_note_length" CHECK (char_length("dorm_return_reports"."verify_note") <= 500),
	CONSTRAINT "dorm_return_reports_validate_note_length" CHECK (char_length("dorm_return_reports"."validate_note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "dorm_leaves" DROP CONSTRAINT "dorm_leaves_decided_when_approved_or_rejected";--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD COLUMN "returned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD COLUMN "return_recorded_by" uuid;--> statement-breakpoint
ALTER TABLE "dorm_return_reports" ADD CONSTRAINT "dorm_return_reports_leave_id_dorm_leaves_id_fk" FOREIGN KEY ("leave_id") REFERENCES "public"."dorm_leaves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_return_reports" ADD CONSTRAINT "dorm_return_reports_verified_by_accounts_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_return_reports" ADD CONSTRAINT "dorm_return_reports_validated_by_accounts_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_return_reports_leave" ON "dorm_return_reports" USING btree ("leave_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_return_reports_one_open" ON "dorm_return_reports" USING btree ("leave_id") WHERE "dorm_return_reports"."status" <> 'rejected';--> statement-breakpoint
CREATE INDEX "dorm_return_reports_waiting" ON "dorm_return_reports" USING btree ("sent_at") WHERE "dorm_return_reports"."status" in ('waiting', 'verified');--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_return_recorded_by_accounts_id_fk" FOREIGN KEY ("return_recorded_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_leaves_out" ON "dorm_leaves" USING btree ("starts_at") WHERE "dorm_leaves"."status" = 'approved' and "dorm_leaves"."kind" <> 'skip_activities';--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_decided_when_approved_rejected_or_completed" CHECK (("dorm_leaves"."status"::text in ('approved', 'rejected', 'completed')) = ("dorm_leaves"."decided_at" is not null) and ("dorm_leaves"."decided_at" is null) = ("dorm_leaves"."decided_by" is null));--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_returned_when_completed" CHECK (("dorm_leaves"."status"::text = 'completed') = ("dorm_leaves"."returned_at" is not null));--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_return_recorded_only_when_returned" CHECK ("dorm_leaves"."return_recorded_by" is null or "dorm_leaves"."returned_at" is not null);--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_returned_after_start" CHECK ("dorm_leaves"."returned_at" is null or "dorm_leaves"."returned_at" >= "dorm_leaves"."starts_at");--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_skip_activities_needs_no_return" CHECK ("dorm_leaves"."kind" <> 'skip_activities' or "dorm_leaves"."returned_at" is null);