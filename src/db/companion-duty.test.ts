import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { settleCompanionDuty } from "./companion-duty";
import type { Database } from "./connect";
import {
  academicPeriods,
  dormCompanions,
  dormRooms,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 2063 is in semester 1 in it, angkatan 2062 in
 * semester 3.
 */
const ODD_2063 = {
  startYear: 2063,
  term: "odd",
  startsOn: "2063-08-01",
  endsOn: "2064-01-31",
} as const;
const DAY = "2063-10-12";

const ENDED = { isActive: false, roomId: null };

interface TestRows {
  studentId: string;
  roomId: string;
}

/** A Reguler woman of semester 3, kakak pendamping of Dana Rakca in a room. */
async function addPlacedCompanion(db: Database): Promise<TestRows> {
  await db.insert(academicPeriods).values(ODD_2063);
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tugas Selesai" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9938620001",
      name: "Sinta Uji",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2062,
    })
    .returning();
  const [room] = await db
    .insert(dormRooms)
    .values({ dorm: "dana_rakca", floor: 1, number: "KS101", capacity: 4 })
    .returning();
  if (!student || !room) throw new Error("The test rows were not added.");
  await db
    .insert(dormCompanions)
    .values({ studentId: student.id, dorm: "dana_rakca", roomId: room.id });
  return { studentId: student.id, roomId: room.id };
}

type Change = Partial<typeof students.$inferInsert>;

/** Changes the student, then settles their duty on the day of the checks. */
async function changeAndSettle(db: Database, studentId: string, to: Change) {
  await db.update(students).set(to).where(eq(students.id, studentId));
  await settleCompanionDuty(db, studentId, DAY);
}

async function dutyOf(db: Database, studentId: string) {
  const [duty] = await db
    .select({
      isActive: dormCompanions.isActive,
      roomId: dormCompanions.roomId,
    })
    .from(dormCompanions)
    .where(eq(dormCompanions.studentId, studentId));
  return duty;
}

describe("settleCompanionDuty", () => {
  it("leaves the duty of a student who still fits it", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, roomId } = await addPlacedCompanion(db);

      await changeAndSettle(db, studentId, { name: "Sinta Uji Baru" });

      expect(await dutyOf(db, studentId)).toEqual({ isActive: true, roomId });
    });
  });

  it.each([
    ["is on leave", { status: "on_leave" }],
    ["is not active", { status: "inactive" }],
    ["was removed", { deletedAt: new Date() }],
    ["became Pembibitan, who live in Wismantara", { isSeedling: true }],
    ["became Internasional, who live in Wismantara", { isInternational: true }],
    ["is of an angkatan in semester 1", { cohortYear: 2063 }],
    ["is a man, while serving Dana Rakca", { sex: "male" }],
  ] as [string, Change][])(
    "ends the duty, and the room is left, when the student %s",
    async (_what, to) => {
      await inTestDatabase(async (db) => {
        const { studentId } = await addPlacedCompanion(db);

        await changeAndSettle(db, studentId, to);

        expect(await dutyOf(db, studentId)).toEqual(ENDED);
      });
    },
  );

  it("does nothing for a student who is no kakak pendamping", async () => {
    await inTestDatabase(async (db) => {
      const { studentId } = await addPlacedCompanion(db);
      await db.delete(dormCompanions);

      await changeAndSettle(db, studentId, { status: "inactive" });

      expect(await dutyOf(db, studentId)).toBeUndefined();
    });
  });
});
