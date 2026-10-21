ALTER TYPE "public"."counselling_schedule_kind" ADD VALUE 'assigned';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_kind" ADD VALUE 'called';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_status" ADD VALUE 'awaiting';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_status" ADD VALUE 'reschedule_asked';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'assign';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'call';--> statement-breakpoint
ALTER TYPE "public"."counselling_schedule_step" ADD VALUE 'set_time';--> statement-breakpoint
ALTER TABLE "counselling_schedules" DROP CONSTRAINT "counselling_schedules_counsellor_once_proposed";--> statement-breakpoint
ALTER TABLE "counselling_schedules" ALTER COLUMN "topic" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ALTER COLUMN "day" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ALTER COLUMN "hour" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ALTER COLUMN "way" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD COLUMN "basis" text;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD COLUMN "sender_message" text;--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_statuses_of_kind" CHECK (case when "counselling_schedules"."kind"::text = 'voluntary'
        then "counselling_schedules"."status"::text not in ('awaiting', 'reschedule_asked')
        else "counselling_schedules"."status"::text not in ('submitted', 'proposed', 'cancelled') end);--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_time_once_set" CHECK ("counselling_schedules"."status"::text = 'awaiting' or ("counselling_schedules"."day" is not null and "counselling_schedules"."hour" is not null and "counselling_schedules"."way" is not null));--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_topic_of_voluntary" CHECK (("counselling_schedules"."kind"::text = 'voluntary') = ("counselling_schedules"."topic" is not null));--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_basis_of_assignment" CHECK (("counselling_schedules"."kind"::text = 'voluntary') = ("counselling_schedules"."basis" is null));--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_sender_message_of_assignment" CHECK ("counselling_schedules"."kind"::text <> 'voluntary' or "counselling_schedules"."sender_message" is null);--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_basis_length" CHECK (char_length("counselling_schedules"."basis") <= 500);--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_sender_message_length" CHECK (char_length("counselling_schedules"."sender_message") <= 500);--> statement-breakpoint
ALTER TABLE "counselling_schedules" ADD CONSTRAINT "counselling_schedules_counsellor_once_proposed" CHECK ("counselling_schedules"."status"::text in ('submitted', 'cancelled', 'awaiting') or "counselling_schedules"."counsellor_id" is not null);