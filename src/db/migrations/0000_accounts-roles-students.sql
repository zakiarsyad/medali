CREATE TYPE "public"."entry_path" AS ENUM('regular', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('head_of_unit', 'director', 'head_of_program', 'mentor', 'student', 'dorm_manager', 'bam_bphk', 'bam_compliance', 'bam_household', 'bam_spiritual', 'bam_catering', 'bam_arts_sports', 'bam_health', 'upk_staff', 'counsellor', 'discipline_officer', 'assessor');--> statement-breakpoint
CREATE TYPE "public"."role_change_action" AS ENUM('added', 'roles_changed', 'removed');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'on_leave', 'inactive');--> statement-breakpoint
CREATE TABLE "account_roles" (
	"account_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	CONSTRAINT "account_roles_account_id_role_pk" PRIMARY KEY("account_id","role")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"nip" text,
	"email" text,
	"unit" text,
	"study_program_id" integer,
	"student_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "accounts_studentId_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "role_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "role_change_action" NOT NULL,
	"roles_before" "role"[] NOT NULL,
	"roles_after" "role"[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nim" text NOT NULL,
	"name" text NOT NULL,
	"study_program_id" integer NOT NULL,
	"entry_path" "entry_path" NOT NULL,
	"sex" "sex" NOT NULL,
	"cohort_year" smallint NOT NULL,
	"class_name" text,
	"province" text,
	"origin_agency" text,
	"is_affirmation" boolean DEFAULT false NOT NULL,
	"is_seedling" boolean DEFAULT false NOT NULL,
	"is_international" boolean DEFAULT false NOT NULL,
	"is_blended" boolean DEFAULT false NOT NULL,
	"status" "student_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "study_programs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "study_programs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "study_programs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_deleted_by_accounts_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_changed_by_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_email_in_use" ON "accounts" USING btree ("email") WHERE "accounts"."deleted_at" is null;