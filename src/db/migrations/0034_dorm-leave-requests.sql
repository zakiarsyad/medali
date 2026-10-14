CREATE TYPE "public"."dorm_leave_kind" AS ENUM('outing', 'skip_activities', 'special');--> statement-breakpoint
CREATE TYPE "public"."dorm_leave_special_reason" AS ENUM('sick', 'family', 'competition', 'administration', 'other');--> statement-breakpoint
CREATE TYPE "public"."dorm_leave_status" AS ENUM('submitted', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "dorm_leaves" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" "dorm_leave_kind" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"special_reason" "dorm_leave_special_reason",
	"purpose" text NOT NULL,
	"destination" text NOT NULL,
	"contact" text NOT NULL,
	"status" "dorm_leave_status" DEFAULT 'submitted' NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decision_note" text DEFAULT '' NOT NULL,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "dorm_leaves_ends_after_start" CHECK ("dorm_leaves"."ends_at" > "dorm_leaves"."starts_at"),
	CONSTRAINT "dorm_leaves_special_reason_only_for_special" CHECK (("dorm_leaves"."kind" = 'special') = ("dorm_leaves"."special_reason" is not null)),
	CONSTRAINT "dorm_leaves_skip_activities_has_no_destination" CHECK ("dorm_leaves"."kind" <> 'skip_activities' or ("dorm_leaves"."destination" = '' and "dorm_leaves"."contact" = '')),
	CONSTRAINT "dorm_leaves_purpose_length" CHECK (char_length("dorm_leaves"."purpose") between 5 and 500),
	CONSTRAINT "dorm_leaves_destination_length" CHECK (char_length("dorm_leaves"."destination") <= 200),
	CONSTRAINT "dorm_leaves_contact_length" CHECK (char_length("dorm_leaves"."contact") <= 100),
	CONSTRAINT "dorm_leaves_decision_note_length" CHECK (char_length("dorm_leaves"."decision_note") <= 500),
	CONSTRAINT "dorm_leaves_decided_when_approved_or_rejected" CHECK (("dorm_leaves"."status" in ('approved', 'rejected')) = ("dorm_leaves"."decided_at" is not null) and ("dorm_leaves"."decided_at" is null) = ("dorm_leaves"."decided_by" is null)),
	CONSTRAINT "dorm_leaves_rejected_has_note" CHECK ("dorm_leaves"."status" <> 'rejected' or "dorm_leaves"."decision_note" <> ''),
	CONSTRAINT "dorm_leaves_cancelled_has_moment" CHECK (("dorm_leaves"."status" = 'cancelled') = ("dorm_leaves"."cancelled_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_leaves" ADD CONSTRAINT "dorm_leaves_decided_by_accounts_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_leaves_student" ON "dorm_leaves" USING btree ("student_id","starts_at");--> statement-breakpoint
CREATE INDEX "dorm_leaves_status" ON "dorm_leaves" USING btree ("status","starts_at");