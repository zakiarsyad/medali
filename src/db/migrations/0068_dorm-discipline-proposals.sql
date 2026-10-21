ALTER TYPE "public"."dorm_warning_letter_change_action" ADD VALUE 'handled';--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD COLUMN "handling_note" text;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD COLUMN "handled_by" uuid;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD COLUMN "handled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_handled_by_accounts_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_handling_is_whole" CHECK (("dorm_warning_letters"."handled_at" is null) = ("dorm_warning_letters"."handled_by" is null) and ("dorm_warning_letters"."handled_at" is null) = ("dorm_warning_letters"."handling_note" is null));--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_handling_only_on_issued_sp2" CHECK ("dorm_warning_letters"."handled_at" is null or ("dorm_warning_letters"."level" = 2 and "dorm_warning_letters"."issued_at" is not null));--> statement-breakpoint
ALTER TABLE "dorm_warning_letters" ADD CONSTRAINT "dorm_warning_letters_handling_note_length" CHECK (char_length("dorm_warning_letters"."handling_note") between 5 and 1000);--> statement-breakpoint
-- Added by hand. An issued warning letter still cannot change, except
-- that Kepala Unit sets the handling of its proposal once: the note, who
-- and when, while everything else stays as it was. A handling once set
-- cannot change either, so the first note is the one kept.
CREATE OR REPLACE FUNCTION refuse_issued_dorm_warning_letter_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.handled_at IS NULL
    AND NEW.handled_at IS NOT NULL
    AND (NEW.id, NEW.student_id, NEW.period_id, NEW.level, NEW.call_day,
      NEW.call_time, NEW.call_place, NEW.result, NEW.proposal_note,
      NEW.issued_by, NEW.issued_at)
      IS NOT DISTINCT FROM
      (OLD.id, OLD.student_id, OLD.period_id, OLD.level, OLD.call_day,
      OLD.call_time, OLD.call_place, OLD.result, OLD.proposal_note,
      OLD.issued_by, OLD.issued_at)
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'An issued dorm warning letter cannot be changed.';
END;
$$;