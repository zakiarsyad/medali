CREATE TYPE "public"."continuation_condition" AS ENUM('served', 'academic', 'character', 'recommendation', 'study_leave');--> statement-breakpoint
CREATE TYPE "public"."continuation_decision" AS ENUM('pending', 'continue', 'dismissed');--> statement-breakpoint
ALTER TYPE "public"."discipline_penalty_change_action" ADD VALUE 'status_changed';--> statement-breakpoint
ALTER TYPE "public"."discipline_penalty_change_action" ADD VALUE 'conditions_changed';--> statement-breakpoint
ALTER TYPE "public"."discipline_penalty_change_action" ADD VALUE 'decision_changed';--> statement-breakpoint
ALTER TYPE "public"."discipline_penalty_status" ADD VALUE 'serving' BEFORE 'set';--> statement-breakpoint
ALTER TYPE "public"."discipline_penalty_status" ADD VALUE 'served' BEFORE 'set';--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD COLUMN "conditions_met" "continuation_condition"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD COLUMN "decision" "continuation_decision" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD COLUMN "status_before" "discipline_penalty_status";--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD COLUMN "status_after" "discipline_penalty_status";--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD COLUMN "conditions_before" "continuation_condition"[];--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD COLUMN "conditions_after" "continuation_condition"[];--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD COLUMN "decision_before" "continuation_decision";--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD COLUMN "decision_after" "continuation_decision";--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD CONSTRAINT "discipline_penalties_conditions_only_when_suspended" CHECK (("discipline_penalties"."category" = 'heavy' and "discipline_penalties"."level" = 1) or (cardinality("discipline_penalties"."conditions_met") = 0 and "discipline_penalties"."decision" = 'pending'));--> statement-breakpoint
ALTER TABLE "discipline_penalties" ADD CONSTRAINT "discipline_penalties_continue_only_when_all_met" CHECK ("discipline_penalties"."decision" <> 'continue' or "discipline_penalties"."conditions_met" @> array['served', 'academic', 'character', 'recommendation', 'study_leave']::continuation_condition[]);--> statement-breakpoint
ALTER TABLE "discipline_penalty_changes" ADD CONSTRAINT "discipline_penalty_changes_values_only_for_follow_up" CHECK (("discipline_penalty_changes"."action" = 'added') = ("discipline_penalty_changes"."status_before" is null)
        and ("discipline_penalty_changes"."status_before" is null) = ("discipline_penalty_changes"."status_after" is null)
        and ("discipline_penalty_changes"."status_before" is null) = ("discipline_penalty_changes"."conditions_before" is null)
        and ("discipline_penalty_changes"."status_before" is null) = ("discipline_penalty_changes"."conditions_after" is null)
        and ("discipline_penalty_changes"."status_before" is null) = ("discipline_penalty_changes"."decision_before" is null)
        and ("discipline_penalty_changes"."status_before" is null) = ("discipline_penalty_changes"."decision_after" is null));