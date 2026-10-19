ALTER TABLE "fitness_tests" ALTER COLUMN "group_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD COLUMN "fingerprint" text;--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD CONSTRAINT "fitness_tests_group_or_file" CHECK (("fitness_tests"."group_id" is null) = ("fitness_tests"."file_name" is not null));--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD CONSTRAINT "fitness_tests_file_has_fingerprint" CHECK (("fitness_tests"."file_name" is null) = ("fitness_tests"."fingerprint" is null));--> statement-breakpoint
ALTER TABLE "fitness_tests" ADD CONSTRAINT "fitness_tests_fingerprint_is_sha256" CHECK ("fitness_tests"."fingerprint" ~ '^[0-9a-f]{64}$');