CREATE TYPE "public"."siku_request_status" AS ENUM('waiting', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE "siku_request_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"place" smallint NOT NULL,
	"photo_key" text,
	"thumb_key" text,
	CONSTRAINT "siku_request_photos_photoKey_unique" UNIQUE("photo_key"),
	CONSTRAINT "siku_request_photos_thumbKey_unique" UNIQUE("thumb_key"),
	CONSTRAINT "siku_request_photos_place" UNIQUE("request_id","place"),
	CONSTRAINT "siku_request_photos_place_in_range" CHECK ("siku_request_photos"."place" between 1 and 3),
	CONSTRAINT "siku_request_photos_both_kept" CHECK (("siku_request_photos"."photo_key" is null) = ("siku_request_photos"."thumb_key" is null))
);
--> statement-breakpoint
CREATE TABLE "siku_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"reason" "siku_reason" NOT NULL,
	"day" date NOT NULL,
	"report" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"status" "siku_request_status" DEFAULT 'waiting' NOT NULL,
	"decided_by" uuid,
	"decided_as" "role",
	"decided_at" timestamp with time zone,
	"decision_note" text DEFAULT '' NOT NULL,
	"entry_id" uuid,
	"withdrawn_at" timestamp with time zone,
	CONSTRAINT "siku_requests_entryId_unique" UNIQUE("entry_id"),
	CONSTRAINT "siku_requests_reason_is_gain" CHECK ("siku_requests"."reason" in ('social_media_campaign', 'knowledge_sharing', 'training_speaker', 'peer_mentoring', 'spiritual_activity')),
	CONSTRAINT "siku_requests_report_length" CHECK (char_length("siku_requests"."report") between 20 and 1000),
	CONSTRAINT "siku_requests_decision_note_length" CHECK (char_length("siku_requests"."decision_note") <= 500),
	CONSTRAINT "siku_requests_decided_when_decided" CHECK (("siku_requests"."status" in ('approved', 'rejected')) = ("siku_requests"."decided_at" is not null) and ("siku_requests"."decided_at" is null) = ("siku_requests"."decided_by" is null) and ("siku_requests"."decided_at" is null) = ("siku_requests"."decided_as" is null)),
	CONSTRAINT "siku_requests_gain_when_approved" CHECK (("siku_requests"."status" = 'approved') = ("siku_requests"."entry_id" is not null)),
	CONSTRAINT "siku_requests_rejected_has_note" CHECK ("siku_requests"."status" <> 'rejected' or "siku_requests"."decision_note" <> ''),
	CONSTRAINT "siku_requests_withdrawn_has_moment" CHECK (("siku_requests"."status" = 'withdrawn') = ("siku_requests"."withdrawn_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "siku_request_photos" ADD CONSTRAINT "siku_request_photos_request_id_siku_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."siku_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_requests" ADD CONSTRAINT "siku_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_requests" ADD CONSTRAINT "siku_requests_decided_by_accounts_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_requests" ADD CONSTRAINT "siku_requests_entry_id_siku_adjustments_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."siku_adjustments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "siku_requests_student" ON "siku_requests" USING btree ("student_id","sent_at");--> statement-breakpoint
CREATE INDEX "siku_requests_status" ON "siku_requests" USING btree ("status","sent_at");