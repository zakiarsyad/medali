ALTER TABLE "activity_attendances" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activity_clarifications" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_clarifications" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_return_reports" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_violation_appeals" ADD COLUMN "file_removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "siku_request_photos" ADD COLUMN "file_removed_at" timestamp with time zone;