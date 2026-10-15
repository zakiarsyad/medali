CREATE TYPE "public"."dorm_violation_appeal_status" AS ENUM('waiting', 'accepted', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."dorm_violation_change_action" ADD VALUE 'appealed';--> statement-breakpoint
ALTER TYPE "public"."dorm_violation_change_action" ADD VALUE 'appeal_accepted';--> statement-breakpoint
ALTER TYPE "public"."dorm_violation_change_action" ADD VALUE 'appeal_rejected';--> statement-breakpoint
CREATE TABLE "dorm_violation_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"violation_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"file_key" text,
	"file_name" text,
	"file_content_type" text,
	"file_size" integer,
	"sent_at" timestamp with time zone NOT NULL,
	"status" "dorm_violation_appeal_status" DEFAULT 'waiting' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decision_note" text DEFAULT '' NOT NULL,
	CONSTRAINT "dorm_violation_appeals_violationId_unique" UNIQUE("violation_id"),
	CONSTRAINT "dorm_violation_appeals_fileKey_unique" UNIQUE("file_key"),
	CONSTRAINT "dorm_violation_appeals_reason_length" CHECK (char_length("dorm_violation_appeals"."reason") between 15 and 500),
	CONSTRAINT "dorm_violation_appeals_proof_is_whole" CHECK (("dorm_violation_appeals"."file_name" is null) = ("dorm_violation_appeals"."file_content_type" is null) and ("dorm_violation_appeals"."file_name" is null) = ("dorm_violation_appeals"."file_size" is null) and ("dorm_violation_appeals"."file_key" is null or "dorm_violation_appeals"."file_name" is not null)),
	CONSTRAINT "dorm_violation_appeals_decided_when_decided" CHECK (("dorm_violation_appeals"."status" <> 'waiting') = ("dorm_violation_appeals"."decided_at" is not null) and ("dorm_violation_appeals"."decided_at" is null) = ("dorm_violation_appeals"."decided_by" is null)),
	CONSTRAINT "dorm_violation_appeals_rejected_has_note" CHECK ("dorm_violation_appeals"."status" <> 'rejected' or "dorm_violation_appeals"."decision_note" <> ''),
	CONSTRAINT "dorm_violation_appeals_note_length" CHECK (char_length("dorm_violation_appeals"."decision_note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "dorm_violation_appeals" ADD CONSTRAINT "dorm_violation_appeals_violation_id_dorm_violations_id_fk" FOREIGN KEY ("violation_id") REFERENCES "public"."dorm_violations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_violation_appeals" ADD CONSTRAINT "dorm_violation_appeals_decided_by_accounts_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_violation_appeals_waiting" ON "dorm_violation_appeals" USING btree ("sent_at") WHERE "dorm_violation_appeals"."status" = 'waiting';