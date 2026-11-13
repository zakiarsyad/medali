CREATE TYPE "public"."religion" AS ENUM('islam', 'protestant', 'catholic', 'hindu', 'buddhist', 'confucian');--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "religion" "religion";