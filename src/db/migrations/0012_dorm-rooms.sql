CREATE TYPE "public"."dorm" AS ENUM('wismantara_putra', 'wismantara_putri', 'dana_rakca', 'cipta_bakti');--> statement-breakpoint
CREATE TABLE "dorm_room_places" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dorm" "dorm" NOT NULL,
	"floor" smallint NOT NULL,
	"number" text NOT NULL,
	"capacity" smallint NOT NULL,
	CONSTRAINT "dorm_rooms_number_in_dorm" UNIQUE("dorm","number"),
	CONSTRAINT "dorm_rooms_floor_in_range" CHECK ("dorm_rooms"."floor" between 1 and 8),
	CONSTRAINT "dorm_rooms_capacity_in_range" CHECK ("dorm_rooms"."capacity" between 1 and 12)
);
--> statement-breakpoint
ALTER TABLE "dorm_room_places" ADD CONSTRAINT "dorm_room_places_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_room_places" ADD CONSTRAINT "dorm_room_places_room_id_dorm_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."dorm_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_room_places_room" ON "dorm_room_places" USING btree ("room_id");