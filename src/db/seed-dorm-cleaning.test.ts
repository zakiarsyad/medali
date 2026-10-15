// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { DORM_IDS } from "@/dorms/dorms";
import type { Database } from "./connect";
import { SAMPLE_CLEANING_PLACES } from "./sample-dorm-cleaning";
import {
  accountRoles,
  dormCleaningChanges,
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

  it("gives a week of duties in Dana Rakca and Cipta Bakti to rooms with residents, by the sample Pengelola Asrama, with the judgements of the past days", async () => {
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
      const first = duties.filter((duty) => duty.repeatOf === null);
      for (const dorm of ["dana_rakca", "cipta_bakti"] as const) {
        const ofDorm = first.filter((duty) => duty.dorm === dorm);
        expect(ofDorm).toHaveLength(days * SAMPLE_CLEANING_PLACES.length);
      }
      const livedIn = lived.map((place) => place.roomId);
      for (const duty of duties) {
        expect(["dana_rakca", "cipta_bakti"]).toContain(duty.dorm);
        expect(livedIn).toContain(duty.roomId);
        expect(duty.placeId).not.toBeNull();
        expect(duty.createdBy).toBe(manager?.id);
      }
      for (const duty of first) {
        expect(duty.day >= daysAfter(today, -3)).toBe(true);
        expect(duty.day <= daysAfter(today, 3)).toBe(true);
      }

      // Read from the same sample set: loading it again for a check of its
      // own makes the whole run slower than its time allows.
      await expectSampleJudgements(db, duties, today);
    });
  });
});

/**
 * The past duties are judged by the sample BAM - Kerumahtanggaan and
 * validated, all but one, each one not met is repeated, and each step is
 * logged.
 */
async function expectSampleJudgements(
  db: Database,
  duties: (typeof dormCleaningDuties.$inferSelect)[],
  today: string,
): Promise<void> {
  const changes = await db.select().from(dormCleaningChanges);
  const [judge] = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, "bam_household"));

  const judged = duties.filter((duty) => duty.status !== "scheduled");
  const validated = judged.filter((duty) => duty.status === "validated");
  const notMet = validated.filter((duty) => duty.result === "not_met");
  const repeats = duties.filter((duty) => duty.repeatOf !== null);
  expect(judged.length).toBeGreaterThan(0);
  expect(judged.length - validated.length).toBe(2);
  expect(notMet.length).toBeGreaterThan(0);
  for (const duty of judged) {
    expect(duty.day < today).toBe(true);
    expect(duty.judgedBy).toBe(judge?.id);
  }
  for (const duty of notMet) {
    expect(duty.judgeNote).not.toBe("");
    const repeat = repeats.find((each) => each.repeatOf === duty.id);
    expect(repeat).toMatchObject({
      placeId: duty.placeId,
      roomId: duty.roomId,
      status: "scheduled",
    });
    expect((repeat?.day ?? "") > today).toBe(true);
  }
  expect(repeats).toHaveLength(notMet.length);
  expect(changes).toHaveLength(judged.length + validated.length);
}
