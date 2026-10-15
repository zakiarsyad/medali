ALTER TYPE "public"."dorm_violation_change_action" ADD VALUE 'reduced';--> statement-breakpoint
ALTER TYPE "public"."dorm_violation_change_action" ADD VALUE 'reduction_undone';--> statement-breakpoint
ALTER TABLE "dorm_violation_changes" ADD COLUMN "reduction_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD COLUMN "reduced_by" uuid;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD COLUMN "reduced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD COLUMN "reduction_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_reduced_by_accounts_id_fk" FOREIGN KEY ("reduced_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_violations_reduced" ON "dorm_violations" USING btree ("reduced_at") WHERE "dorm_violations"."reduced_at" is not null;--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_reduction_is_whole" CHECK (("dorm_violations"."reduced_by" is null) = ("dorm_violations"."reduced_at" is null) and ("dorm_violations"."reduced_at" is null) = ("dorm_violations"."reduction_reason" = ''));--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_reduction_reason_length" CHECK ("dorm_violations"."reduction_reason" = '' or char_length("dorm_violations"."reduction_reason") between 5 and 500);--> statement-breakpoint
ALTER TABLE "dorm_violations" ADD CONSTRAINT "dorm_violations_reduced_once_announced_and_not_cancelled" CHECK ("dorm_violations"."reduced_at" is null or ("dorm_violations"."reduced_at" >= "dorm_violations"."announced_at" and "dorm_violations"."cancelled_at" is null));