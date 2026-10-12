CREATE TABLE "student_batch_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"byte_size" integer NOT NULL,
	"content_type" text NOT NULL,
	"kept_at" timestamp with time zone NOT NULL,
	"kept_by" uuid NOT NULL,
	CONSTRAINT "student_batch_files_batchId_unique" UNIQUE("batch_id"),
	CONSTRAINT "student_batch_files_objectKey_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "student_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input_at" timestamp with time zone NOT NULL,
	"input_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "input_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "student_batch_files" ADD CONSTRAINT "student_batch_files_batch_id_student_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."student_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_batch_files" ADD CONSTRAINT "student_batch_files_kept_by_accounts_id_fk" FOREIGN KEY ("kept_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_batches" ADD CONSTRAINT "student_batches_input_by_accounts_id_fk" FOREIGN KEY ("input_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_input_batch_id_student_batches_id_fk" FOREIGN KEY ("input_batch_id") REFERENCES "public"."student_batches"("id") ON DELETE no action ON UPDATE no action;