CREATE TABLE "dorm_companions" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"dorm" "dorm" NOT NULL,
	"note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"room_id" uuid,
	CONSTRAINT "dorm_companions_dorm_has_companions" CHECK ("dorm_companions"."dorm" in ('dana_rakca', 'cipta_bakti')),
	CONSTRAINT "dorm_companions_room_only_while_active" CHECK ("dorm_companions"."is_active" or "dorm_companions"."room_id" is null)
);
--> statement-breakpoint
ALTER TABLE "dorm_companions" ADD CONSTRAINT "dorm_companions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_companions" ADD CONSTRAINT "dorm_companions_room_id_dorm_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."dorm_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_companions_room" ON "dorm_companions" USING btree ("room_id");