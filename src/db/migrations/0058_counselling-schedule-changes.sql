ALTER TYPE "public"."counselling_schedule_status" ADD VALUE 'done';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_status" ADD VALUE 'missed';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'cancel';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'reschedule';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'mark_done';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'mark_missed';--> statement-breakpoint
ALTER TABLE "counselling_schedules" DROP CONSTRAINT "counselling_schedules_counsellor_once_proposed";--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_counsellor_once_proposed" CHECK ("counselling_schedules"."status"::text in ('submitted', 'cancelled') or "counselling_schedules"."counsellor_id" is not null);