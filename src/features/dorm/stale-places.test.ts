import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readDormCohorts } from "./dorm-cohorts";
import { readRooms } from "./room-list";
import { freeStalePlaces } from "./stale-places";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  DAY,
  ODD_2026,
  placeTestResident,
  residentsOfRoom,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** The day a year later: angkatan 2026 is in semester 3. */
const A_YEAR_LATER = "2027-10-12";
const ODD_2027 = {
  startYear: 2027,
  term: "odd",
  startsOn: "2027-08-01",
  endsOn: "2028-01-31",
} as const;

interface Placed {
  roomId: string;
  studentId: string;
}

/** A Reguler woman of semester 1 with a place in a room of Dana Rakca. */
async function addPlacedResident(db: Database): Promise<Placed> {
  await db.insert(academicPeriods).values(ODD_2026);
  const program = await addTestProgram(db, "Prodi Uji Asrama");
  const studentId = await addTestStudent(db, program, {
    nim: "9911260001",
    name: "Penghuni Uji",
  });
  const roomId = await addTestRoom(db, { capacity: 1 });
  await placeTestResident(db, roomId, studentId);
  return { roomId, studentId };
}

async function loadOn(db: Database, day: string): Promise<void> {
  await freeStalePlaces(db, await readDormCohorts(db, day));
}

async function takenIn(db: Database, roomId: string): Promise<number> {
  const rooms = await readRooms(db, "dana_rakca");
  return rooms.find((room) => room.id === roomId)?.taken ?? -1;
}

describe("freeStalePlaces", () => {
  it("keeps the place of a student who still lives in the dorm", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);

      await loadOn(db, DAY);

      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
      expect(await takenIn(db, roomId)).toBe(1);
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "frees the place of a resident whose status became %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { roomId, studentId } = await addPlacedResident(db);
        await db
          .update(students)
          .set({ status })
          .where(eq(students.id, studentId));

        await loadOn(db, DAY);

        expect(await residentsOfRoom(db, roomId)).toEqual([]);
        expect(await takenIn(db, roomId)).toBe(0);
      });
    },
  );

  it("frees the place of a Reguler resident who reaches semester 3", async () => {
    await inTestDatabase(async (db) => {
      const { roomId } = await addPlacedResident(db);
      await db.insert(academicPeriods).values(ODD_2027);

      await loadOn(db, A_YEAR_LATER);

      expect(await residentsOfRoom(db, roomId)).toEqual([]);
      expect(await takenIn(db, roomId)).toBe(0);
    });
  });

  it("keeps the place of a Pembibitan resident who reaches semester 3", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([ODD_2026, ODD_2027]);
      const program = await addTestProgram(db, "Prodi Uji Asrama");
      const studentId = await addTestStudent(db, program, {
        nim: "9911260001",
        name: "Penghuni Uji",
        isSeedling: true,
      });
      const roomId = await addTestRoom(db, { dorm: "wismantara_putri" });
      await placeTestResident(db, roomId, studentId);

      await loadOn(db, A_YEAR_LATER);

      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
    });
  });

  it("frees the place of a resident who now lives in another dorm", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);
      await db
        .update(students)
        .set({ isInternational: true })
        .where(eq(students.id, studentId));

      await loadOn(db, DAY);

      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it("frees the place of a removed student", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, studentId } = await addPlacedResident(db);
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, studentId));

      await loadOn(db, DAY);

      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });
});
