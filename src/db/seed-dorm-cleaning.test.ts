// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { DORM_IDS } from "@/dorms/dorms";
import { SAMPLE_CLEANING_PLACES } from "./sample-dorm-cleaning";
import {
  accountRoles,
  dormCleaningDuties,
  dormCleaningPlaces,
  dormRoomPlaces,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample dorm cleaning", { timeout: 20_000 }, () => {
  it("gives every dorm the four places of the prototype, none removed", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const places = await db.select().from(dormCleaningPlaces);

      expect(places).toHaveLength(DORM_IDS.length * 4);
      for (const dorm of DORM_IDS) {
        const names = places
          .filter((place) => place.dorm === dorm)
          .map((place) => place.name);
        expect(names.sort()).toEqual([...SAMPLE_CLEANING_PLACES].sort());
      }
      expect(places.every((place) => place.deletedAt === null)).toBe(true);
    });
  });

  it("gives a week of duties in Dana Rakca and Cipta Bakti to rooms with residents, by the sample Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = campusDay();

      const duties = await db.select().from(dormCleaningDuties);
      const lived = await db
        .selectDistinct({ roomId: dormRoomPlaces.roomId })
        .from(dormRoomPlaces);
      const [manager] = await db
        .select({ id: accountRoles.accountId })
        .from(accountRoles)
        .where(eq(accountRoles.role, "dorm_manager"));

      const days = 7;
      for (const dorm of ["dana_rakca", "cipta_bakti"] as const) {
        const ofDorm = duties.filter((duty) => duty.dorm === dorm);
        expect(ofDorm).toHaveLength(days * SAMPLE_CLEANING_PLACES.length);
      }
      const livedIn = lived.map((place) => place.roomId);
      for (const duty of duties) {
        expect(["dana_rakca", "cipta_bakti"]).toContain(duty.dorm);
        expect(livedIn).toContain(duty.roomId);
        expect(duty.placeId).not.toBeNull();
        expect(duty.createdBy).toBe(manager?.id);
        expect(duty.day >= daysAfter(today, -3)).toBe(true);
        expect(duty.day <= daysAfter(today, 3)).toBe(true);
      }
    });
  });
});
