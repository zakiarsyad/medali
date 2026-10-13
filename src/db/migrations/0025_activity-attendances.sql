CREATE TYPE "public"."activity_attendance_status" AS ENUM('waiting', 'valid', 'rejected', 'dispensation');--> statement-breakpoint
CREATE TABLE "activity_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "activity_attendance_status" NOT NULL,
	"photo_key" text,
	"sent_at" timestamp with time zone,
	"note" text NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	CONSTRAINT "activity_attendances_photoKey_unique" UNIQUE("photo_key"),
	CONSTRAINT "activity_attendances_waiting_is_sent" CHECK ("activity_attendances"."status" <> 'waiting' or "activity_attendances"."sent_at" is not null),
	CONSTRAINT "activity_attendances_decided_unless_waiting" CHECK (("activity_attendances"."status" = 'waiting') = ("activity_attendances"."decided_at" is null) and ("activity_attendances"."decided_at" is null) = ("activity_attendances"."decided_by" is null))
);
--> statement-breakpoint
ALTER TABLE "activity_attendances" ADD CONSTRAINT "activity_attendances_schedule_id_activity_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."activity_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attendances" ADD CONSTRAINT "activity_attendances_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attendances" ADD CONSTRAINT "activity_attendances_decided_by_accounts_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_attendances_one_waiting_or_valid" ON "activity_attendances" USING btree ("schedule_id","student_id") WHERE "activity_attendances"."status" in ('waiting', 'valid');--> statement-breakpoint
CREATE INDEX "activity_attendances_student" ON "activity_attendances" USING btree ("student_id");