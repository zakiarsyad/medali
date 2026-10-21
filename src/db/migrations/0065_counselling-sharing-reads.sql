CREATE TABLE "counselling_sharing_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sharing_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"read_by" uuid NOT NULL,
	"read_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "counselling_sharing_reads" ADD CONSTRAINT "counselling_sharing_reads_sharing_id_counselling_sharings_id_fk" FOREIGN KEY ("sharing_id") REFERENCES "public"."counselling_sharings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharing_reads" ADD CONSTRAINT "counselling_sharing_reads_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselling_sharing_reads" ADD CONSTRAINT "counselling_sharing_reads_read_by_accounts_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "counselling_sharing_reads_student" ON "counselling_sharing_reads" USING btree ("student_id","read_at");