CREATE TYPE "public"."health_illness" AS ENUM('asthma', 'hypertension', 'diabetes', 'heart_disease', 'gastric_disorder', 'allergy', 'epilepsy', 'bone_joint_injury', 'infectious_disease', 'other');--> statement-breakpoint
CREATE TYPE "public"."health_note_category" AS ENUM('good', 'attention', 'medical');--> statement-breakpoint
CREATE TABLE "health_note_illnesses" (
	"note_id" uuid NOT NULL,
	"illness" "health_illness" NOT NULL,
	"note" text NOT NULL,
	CONSTRAINT "health_note_illnesses_note_id_illness_pk" PRIMARY KEY("note_id","illness"),
	CONSTRAINT "health_note_illnesses_note_length" CHECK (char_length("health_note_illnesses"."note") <= 200)
);
--> statement-breakpoint
CREATE TABLE "health_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"examined_on" date NOT NULL,
	"examiner" text,
	"other_history" text NOT NULL,
	"medicine" text NOT NULL,
	"advice" text NOT NULL,
	"category" "health_note_category",
	"saved_by" uuid NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "health_notes_short_texts" CHECK (char_length("health_notes"."examiner") <= 200 and char_length("health_notes"."other_history") <= 200 and char_length("health_notes"."medicine") <= 200),
	CONSTRAINT "health_notes_advice_length" CHECK (char_length("health_notes"."advice") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "health_recap_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"read_by" uuid NOT NULL,
	"read_at" timestamp with time zone NOT NULL,
	"filters" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_note_illnesses" ADD CONSTRAINT "health_note_illnesses_note_id_health_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."health_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_notes" ADD CONSTRAINT "health_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_notes" ADD CONSTRAINT "health_notes_saved_by_accounts_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_recap_readings" ADD CONSTRAINT "health_recap_readings_read_by_accounts_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_notes_student_saved_at" ON "health_notes" USING btree ("student_id","saved_at");--> statement-breakpoint
CREATE INDEX "health_recap_readings_read_at" ON "health_recap_readings" USING btree ("read_at");--> statement-breakpoint
-- Added by hand. Health notes are their own log, and the readings of the
-- recap are the log of who read them, so both must always be trusted:
-- the database itself refuses to change or delete one. Row triggers do
-- not see TRUNCATE, which would empty a log in one statement, so that
-- has a trigger of its own.
CREATE FUNCTION refuse_health_note_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The health notes and the readings of their recap cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER health_notes_cannot_change
BEFORE UPDATE OR DELETE ON health_notes
FOR EACH ROW EXECUTE FUNCTION refuse_health_note_edit();--> statement-breakpoint
CREATE TRIGGER health_notes_cannot_be_emptied
BEFORE TRUNCATE ON health_notes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_health_note_edit();--> statement-breakpoint
CREATE TRIGGER health_note_illnesses_cannot_change
BEFORE UPDATE OR DELETE ON health_note_illnesses
FOR EACH ROW EXECUTE FUNCTION refuse_health_note_edit();--> statement-breakpoint
CREATE TRIGGER health_note_illnesses_cannot_be_emptied
BEFORE TRUNCATE ON health_note_illnesses
FOR EACH STATEMENT EXECUTE FUNCTION refuse_health_note_edit();--> statement-breakpoint
CREATE TRIGGER health_recap_readings_cannot_change
BEFORE UPDATE OR DELETE ON health_recap_readings
FOR EACH ROW EXECUTE FUNCTION refuse_health_note_edit();--> statement-breakpoint
CREATE TRIGGER health_recap_readings_cannot_be_emptied
BEFORE TRUNCATE ON health_recap_readings
FOR EACH STATEMENT EXECUTE FUNCTION refuse_health_note_edit();
