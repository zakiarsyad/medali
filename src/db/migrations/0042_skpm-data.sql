CREATE TYPE "public"."skpm_upload_action" AS ENUM('uploaded', 'removed');--> statement-breakpoint
CREATE TYPE "public"."skpm_upload_mode" AS ENUM('add', 'replace');--> statement-breakpoint
CREATE TABLE "skpm_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"points_for_hundred" smallint NOT NULL,
	"points_before" smallint NOT NULL,
	"set_by" uuid NOT NULL,
	"set_at" timestamp with time zone NOT NULL,
	CONSTRAINT "skpm_conversions_in_range" CHECK ("skpm_conversions"."points_for_hundred" between 1 and 1000 and "skpm_conversions"."points_before" between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "skpm_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" uuid NOT NULL,
	"line" integer NOT NULL,
	"student_id" uuid NOT NULL,
	"activity" text NOT NULL,
	"category" text NOT NULL,
	"level" text,
	"activity_role" text,
	"day" text,
	"points" numeric(6, 2) NOT NULL,
	CONSTRAINT "skpm_rows_line" UNIQUE("upload_id","line"),
	CONSTRAINT "skpm_rows_points_in_range" CHECK ("skpm_rows"."points" between 0 and 1000),
	CONSTRAINT "skpm_rows_activity_length" CHECK (char_length("skpm_rows"."activity") between 1 and 200),
	CONSTRAINT "skpm_rows_label_lengths" CHECK (char_length("skpm_rows"."category") between 1 and 100 and char_length("skpm_rows"."level") between 1 and 100 and char_length("skpm_rows"."activity_role") between 1 and 100),
	CONSTRAINT "skpm_rows_day_length" CHECK (char_length("skpm_rows"."day") between 1 and 30)
);
--> statement-breakpoint
CREATE TABLE "skpm_upload_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "skpm_upload_action" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skpm_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"fingerprint" text NOT NULL,
	"mode" "skpm_upload_mode" NOT NULL,
	"period_id" uuid NOT NULL,
	"row_count" smallint NOT NULL,
	"student_count" smallint NOT NULL,
	"entered_by" uuid NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"removed_by" uuid,
	"removed_at" timestamp with time zone,
	CONSTRAINT "skpm_uploads_fingerprint_is_sha256" CHECK ("skpm_uploads"."fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "skpm_uploads_counts" CHECK ("skpm_uploads"."student_count" between 1 and "skpm_uploads"."row_count"),
	CONSTRAINT "skpm_uploads_removal_is_whole" CHECK (("skpm_uploads"."removed_by" is null) = ("skpm_uploads"."removed_at" is null))
);
--> statement-breakpoint
ALTER TABLE "skpm_conversions" ADD CONSTRAINT "skpm_conversions_set_by_accounts_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_rows" ADD CONSTRAINT "skpm_rows_upload_id_skpm_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."skpm_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_rows" ADD CONSTRAINT "skpm_rows_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_upload_changes" ADD CONSTRAINT "skpm_upload_changes_upload_id_skpm_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."skpm_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_upload_changes" ADD CONSTRAINT "skpm_upload_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_uploads" ADD CONSTRAINT "skpm_uploads_period_id_academic_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_uploads" ADD CONSTRAINT "skpm_uploads_entered_by_accounts_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skpm_uploads" ADD CONSTRAINT "skpm_uploads_removed_by_accounts_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skpm_conversions_set_at" ON "skpm_conversions" USING btree ("set_at");--> statement-breakpoint
CREATE INDEX "skpm_rows_student" ON "skpm_rows" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "skpm_upload_changes_upload" ON "skpm_upload_changes" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "skpm_uploads_entered_at" ON "skpm_uploads" USING btree ("entered_at");--> statement-breakpoint
-- Added by hand. The log of SKPM uploads and the settings of "Poin untuk
-- nilai 100" are records of a score that must always be trusted, so the
-- database itself refuses to change or delete a line of them. Row
-- triggers do not see TRUNCATE, which would empty a log in one statement,
-- so that has a trigger of its own. An upload is held by its log lines,
-- so it cannot be deleted either.
CREATE FUNCTION refuse_skpm_log_edit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The logs of SKPM data cannot be changed or deleted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER skpm_upload_changes_cannot_change
BEFORE UPDATE OR DELETE ON skpm_upload_changes
FOR EACH ROW EXECUTE FUNCTION refuse_skpm_log_edit();--> statement-breakpoint
CREATE TRIGGER skpm_upload_changes_cannot_be_emptied
BEFORE TRUNCATE ON skpm_upload_changes
FOR EACH STATEMENT EXECUTE FUNCTION refuse_skpm_log_edit();--> statement-breakpoint
CREATE TRIGGER skpm_conversions_cannot_change
BEFORE UPDATE OR DELETE ON skpm_conversions
FOR EACH ROW EXECUTE FUNCTION refuse_skpm_log_edit();--> statement-breakpoint
CREATE TRIGGER skpm_conversions_cannot_be_emptied
BEFORE TRUNCATE ON skpm_conversions
FOR EACH STATEMENT EXECUTE FUNCTION refuse_skpm_log_edit();
