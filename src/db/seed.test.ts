import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { DORM_IDS } from "@/features/dorm/dorms";
import { readStudentDorm } from "@/features/dorm/student-dorm";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_STUDENTS,
  samplePeriods,
} from "./sample-data";
import { SAMPLE_ROOMS, sampleFirstYears } from "./sample-dorms";
import {
  academicPeriodChanges,
  academicPeriods,
  accounts,
  dormRoomPlaces,
  dormRooms,
  ppksActivities,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

function firstYearsOfToday() {
  const [running] = samplePeriods(campusDay());
  if (!running) throw new Error("There are no sample periods.");
  return sampleFirstYears(running.startYear);
}

const PLACED_IN_A_DORM = SAMPLE_ROOMS.reduce(
  (sum, room) => sum + room.placed,
  0,
);

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("fillWithSampleData", { timeout: 20_000 }, () => {
  it("adds every sample student, those in their first year today, and rooms on a few floors of each dorm with some of its residents placed", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const added = await db.select({ nim: students.nim }).from(students);
      const sample = [...SAMPLE_STUDENTS, ...firstYearsOfToday()];
      expect(added.map((student) => student.nim).sort()).toEqual(
        sample.map((student) => student.nim).sort(),
      );

      const rooms = await db.select().from(dormRooms);
      const placed = await db
        .select({ studentId: dormRoomPlaces.studentId, dorm: dormRooms.dorm })
        .from(dormRoomPlaces)
        .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId));
      for (const dorm of DORM_IDS) {
        const inDorm = rooms.filter((room) => room.dorm === dorm);
        expect(inDorm).toHaveLength(SAMPLE_ROOMS.length);
        const floors = new Set(inDorm.map((room) => room.floor));
        expect(floors.size).toBeGreaterThanOrEqual(3);

        const placedInDorm = placed.filter((place) => place.dorm === dorm);
        expect(placedInDorm).toHaveLength(PLACED_IN_A_DORM);
        const livesIn = await Promise.all(
          placedInDorm.map((place) => readStudentDorm(db, place.studentId)),
        );
        expect(livesIn).toEqual(placedInDorm.map(() => dorm));
      }
    });
  });

  it("adds the sample PPKS activities, changed by the sample Kepala Unit", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const added = await db
        .select({ name: ppksActivities.name, by: accounts.name })
        .from(ppksActivities)
        .innerJoin(accounts, eq(accounts.id, ppksActivities.changedBy));
      expect(added.map((activity) => activity.name).sort()).toEqual(
        SAMPLE_PPKS_ACTIVITIES.map((activity) => activity.name).sort(),
      );
      for (const activity of added) {
        expect(activity.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
      }
    });
  });

  it("adds the period of today and the three before it, each in the log", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const today = campusDay();
      const periods = await db.select().from(academicPeriods);
      expect(periods).toHaveLength(4);
      const running = periods.filter(
        (period) => period.startsOn <= today && today <= period.endsOn,
      );
      expect(running).toHaveLength(1);
      const earlier = periods.filter((period) => period.endsOn < today);
      expect(earlier).toHaveLength(3);

      const logged = await db
        .select({
          periodId: academicPeriodChanges.periodId,
          action: academicPeriodChanges.action,
          by: accounts.name,
        })
        .from(academicPeriodChanges)
        .innerJoin(accounts, eq(accounts.id, academicPeriodChanges.changedBy));
      expect(logged.map((line) => line.periodId).sort()).toEqual(
        periods.map((period) => period.id).sort(),
      );
      for (const line of logged) {
        expect(line.action).toBe("added");
        expect(line.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
      }
    });
  });
});
