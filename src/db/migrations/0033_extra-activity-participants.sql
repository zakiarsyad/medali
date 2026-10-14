CREATE TABLE "activity_schedule_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"student_id" uuid,
	"class_name" text,
	"cohort_year" smallint,
	CONSTRAINT "activity_schedule_participants_names_one" CHECK (num_nonnulls("activity_schedule_participants"."student_id", "activity_schedule_participants"."class_name", "activity_schedule_participants"."cohort_year") = 1)
);
--> statement-breakpoint
ALTER TABLE "activity_schedule_participants" ADD CONSTRAINT "activity_schedule_participants_schedule_id_activity_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."activity_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedule_participants" ADD CONSTRAINT "activity_schedule_participants_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_schedule_participants_student" ON "activity_schedule_participants" USING btree ("schedule_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_schedule_participants_class" ON "activity_schedule_participants" USING btree ("schedule_id","class_name");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_schedule_participants_cohort" ON "activity_schedule_participants" USING btree ("schedule_id","cohort_year");