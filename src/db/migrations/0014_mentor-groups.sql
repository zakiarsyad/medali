CREATE TABLE "mentor_group_members" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_group_mentors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"end_reason" text,
	CONSTRAINT "mentor_group_mentors_ends_after_start" CHECK ("mentor_group_mentors"."ends_on" >= "mentor_group_mentors"."starts_on"),
	CONSTRAINT "mentor_group_mentors_reason_only_when_ended" CHECK ("mentor_group_mentors"."end_reason" is null or "mentor_group_mentors"."ends_on" is not null)
);
--> statement-breakpoint
CREATE TABLE "mentor_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_program_id" integer NOT NULL,
	"cohort_year" smallint NOT NULL,
	"entry_path" "entry_path" NOT NULL,
	"number" smallint NOT NULL,
	"starts_on" date NOT NULL,
	CONSTRAINT "mentor_groups_number_in_cohort" UNIQUE("study_program_id","cohort_year","entry_path","number"),
	CONSTRAINT "mentor_groups_number_from_1" CHECK ("mentor_groups"."number" >= 1)
);
--> statement-breakpoint
-- Written by hand from here to the next table change: the nine fixed study
-- programs are already there, so the code is added empty, filled, and only
-- then made required.
ALTER TABLE "study_programs" ADD COLUMN "code" text;--> statement-breakpoint
UPDATE "study_programs" SET "code" = "codes"."code"
FROM (VALUES
  ('Akuntansi Sektor Publik STR', 'ASP'),
  ('D3 Akuntansi', 'D3AK'),
  ('D3 Kebendaharaan Negara', 'D3KBN'),
  ('D3 Kepabeanan dan Cukai', 'D3BC'),
  ('D3 Manajemen Aset', 'D3MA'),
  ('D3 PBB/Penilai', 'D3PBB'),
  ('D3 Pajak', 'D3PJK'),
  ('Manajemen Aset Publik STR', 'MAP'),
  ('Manajemen Keuangan Negara STR', 'MKN')
) AS "codes" ("name", "code")
WHERE "study_programs"."name" = "codes"."name";--> statement-breakpoint
ALTER TABLE "study_programs" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_group_members" ADD CONSTRAINT "mentor_group_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_members" ADD CONSTRAINT "mentor_group_members_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_mentors" ADD CONSTRAINT "mentor_group_mentors_group_id_mentor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."mentor_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_group_mentors" ADD CONSTRAINT "mentor_group_mentors_mentor_id_accounts_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_groups" ADD CONSTRAINT "mentor_groups_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_group_members_group" ON "mentor_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_group_mentors_one_current" ON "mentor_group_mentors" USING btree ("group_id") WHERE "mentor_group_mentors"."ends_on" is null;--> statement-breakpoint
CREATE INDEX "mentor_group_mentors_mentor" ON "mentor_group_mentors" USING btree ("mentor_id");--> statement-breakpoint
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_code_unique" UNIQUE("code");