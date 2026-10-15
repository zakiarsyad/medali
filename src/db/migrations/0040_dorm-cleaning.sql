CREATE TABLE "dorm_cleaning_duties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"dorm" "dorm" NOT NULL,
	"place_id" uuid,
	"room_id" uuid,
	"room_number" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_cleaning_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dorm" "dorm" NOT NULL,
	"name" text NOT NULL,
	"removed_from" date,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "dorm_cleaning_places_name_length" CHECK (char_length("dorm_cleaning_places"."name") between 3 and 60),
	CONSTRAINT "dorm_cleaning_places_removal_mark_is_whole" CHECK (("dorm_cleaning_places"."deleted_at" is null) = ("dorm_cleaning_places"."deleted_by" is null) and ("dorm_cleaning_places"."deleted_at" is null) = ("dorm_cleaning_places"."removed_from" is null))
);
--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_place_id_dorm_cleaning_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."dorm_cleaning_places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_room_id_dorm_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."dorm_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_duties" ADD CONSTRAINT "dorm_cleaning_duties_created_by_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_cleaning_places" ADD CONSTRAINT "dorm_cleaning_places_deleted_by_accounts_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_cleaning_duties_one_per_place_and_day" ON "dorm_cleaning_duties" USING btree ("place_id","day") WHERE "dorm_cleaning_duties"."place_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_cleaning_duties_one_own_room_per_day" ON "dorm_cleaning_duties" USING btree ("room_id","day") WHERE "dorm_cleaning_duties"."place_id" is null;--> statement-breakpoint
CREATE INDEX "dorm_cleaning_duties_room_day" ON "dorm_cleaning_duties" USING btree ("room_id","day");--> statement-breakpoint
CREATE INDEX "dorm_cleaning_duties_day_dorm" ON "dorm_cleaning_duties" USING btree ("day","dorm");--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_cleaning_places_name_in_dorm" ON "dorm_cleaning_places" USING btree ("dorm",lower("name")) WHERE "dorm_cleaning_places"."deleted_at" is null;