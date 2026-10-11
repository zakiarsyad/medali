ALTER TABLE "students" ADD COLUMN "input_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "input_by" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "input_source" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_input_by_accounts_id_fk" FOREIGN KEY ("input_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_deleted_by_accounts_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;