CREATE TYPE "public"."siku_adjustment_change_action" AS ENUM('entered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."siku_kind" AS ENUM('gain', 'loss');--> statement-breakpoint
CREATE TYPE "public"."siku_reason" AS ENUM('social_media_campaign', 'knowledge_sharing', 'training_speaker', 'peer_mentoring', 'spiritual_activity', 'student_violation', 'discipline_penalty', 'unannounced_absence', 'director_decision');--> statement-breakpoint
CREATE TABLE "siku_adjustment_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adjustment_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "siku_adjustment_change_action" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siku_adjustment_students" (
	"adjustment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	CONSTRAINT "siku_adjustment_students_adjustment_id_student_id_pk" PRIMARY KEY("adjustment_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "siku_adjustments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" "siku_kind" NOT NULL,
	"reason" "siku_reason" NOT NULL,
	"points" smallint NOT NULL,
	"day" date NOT NULL,
	"note" text NOT NULL,
	"basis" text NOT NULL,
	"period_id" uuid NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_as" "role" NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "siku_adjustments_points_in_range" CHECK ("siku_adjustments"."points" between 1 and 30),
	CONSTRAINT "siku_adjustments_reason_fits_kind" CHECK (("siku_adjustments"."kind" = 'gain') = ("siku_adjustments"."reason" in ('social_media_campaign', 'knowledge_sharing', 'training_speaker', 'peer_mentoring', 'spiritual_activity'))),
	CONSTRAINT "siku_adjustments_basis_only_for_decision" CHECK (("siku_adjustments"."reason" = 'director_decision') = ("siku_adjustments"."basis" <> '')),
	CONSTRAINT "siku_adjustments_note_length" CHECK (char_length("siku_adjustments"."note") <= 500),
	CONSTRAINT "siku_adjustments_basis_length" CHECK (char_length("siku_adjustments"."basis") <= 200),
	CONSTRAINT "siku_adjustments_cancel_is_whole" CHECK (("siku_adjustments"."cancelled_by" is null) = ("siku_adjustments"."cancelled_at" is null))
);
--> statement-breakpoint
ALTER TABLE "siku_adjustment_changes" ADD CONSTRAINT "siku_adjustment_changes_adjustment_id_siku_adjustments_id_fk" FOREIGN KEY ("adjustment_id") REFERENCES "public"."siku_adjustments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_adjustment_changes" ADD CONSTRAINT "siku_adjustment_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_adjustment_students" ADD CONSTRAINT "siku_adjustment_students_adjustment_id_siku_adjustments_id_fk" FOREIGN KEY ("adjustment_id") REFERENCES "public"."siku_adjustments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_adjustment_students" ADD CONSTRAINT "siku_adjustment_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_adjustments" ADD CONSTRAINT "siku_adjustments_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_adjustments" ADD CONSTRAINT "siku_adjustments_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siku_adjustments" ADD CONSTRAINT "siku_adjustments_cancelled_by_accounts_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "siku_adjustment_changes_adjustment" ON "siku_adjustment_changes" USING btree ("adjustment_id");--> statement-breakpoint
CREATE INDEX "siku_adjustment_students_student" ON "siku_adjustment_students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "siku_adjustments_day" ON "siku_adjustments" USING btree ("day","entered_at");--> statement-breakpoint
-- Added by hand. The log of SIKU entries is a record of a score that must
-- always be trusted, so the database itself refuses to change or delete a
-- line of it. Row triggers do not see TRUNCATE, which would empty the log
-- in one statement, so that has a trigger of its own. An entry is held by
-- its log lines, so it cannot be deleted either.
CREATE FUNCTION refuse_siku_adjustment_change_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The log of SIKU entries cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER siku_adjustment_changes_cannot_change
BEFORE UPDATE OR DELETE ON siku_adjustment_changes
FOR EACH ROW EXECUTE FUNCTION refuse_siku_adjustment_change_edit();--> statement-breakpoint
CREATE TRIGGER siku_adjustment_changes_cannot_be_emptied
BEFORE TRUNCATE ON siku_adjustment_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_siku_adjustment_change_edit();
