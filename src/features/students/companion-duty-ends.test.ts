import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormCompanions, dormRooms, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeStudent, removeStudent } from "./change-student";
import { inputStudent } from "./input-student";
import type { StudentInput } from "./student-input";
import { addTestActor, addTestProgram, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const NIM = "9935240001";

interface TestRows {
  staff: TestActor;
  input: StudentInput;
  studentId: string;
  roomId: string;
}

/** A senior put in through the tab, kakak pendamping of Dana Rakca in a room. */
async function addPlacedCompanion(db: Database): Promise<TestRows> {
  const program = await addTestProgram(db, "Prodi Uji Tugas Berakhir");
  const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
  const input: StudentInput = {
    nim: NIM,
    name: "Sinta Uji",
    studyProgramId: program,
    entryPath: "regular",
    sex: "female",
    cohortYear: 2024,
    className: null,
    province: null,
    originAgency: null,
    status: "active",
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
  };
  const added = await inputStudent(db, staff, input);
  if (!added.ok) throw new Error(added.error);
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nim, NIM));
  const [room] = await db
    .insert(dormRooms)
    .values({ dorm: "dana_rakca", floor: 1, number: "KB101", capacity: 4 })
    .returning({ id: dormRooms.id });
  if (!student || !room) throw new Error("The test rows were not added.");
  await db
    .insert(dormCompanions)
    .values({ studentId: student.id, dorm: "dana_rakca", roomId: room.id });
  return { staff, input, studentId: student.id, roomId: room.id };
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

const ENDED = { isActive: false, roomId: null };

describe("the duty of a kakak pendamping", () => {
  it.each(["on_leave", "inactive"] as const)(
    "ends, and the room is left, when the status becomes %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { staff, input, studentId } = await addPlacedCompanion(db);

        const changed = await changeStudent(db, staff, { ...input, status });

        expect(changed.ok).toBe(true);
        expect(await dutyOf(db, studentId)).toEqual(ENDED);
      });
    },
  );

  it.each(["on_leave", "inactive"] as const)(
    "stays ended when the status was %s and becomes active again",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { staff, input, studentId } = await addPlacedCompanion(db);
        await changeStudent(db, staff, { ...input, status });

        await changeStudent(db, staff, { ...input, status: "active" });

        expect(await dutyOf(db, studentId)).toEqual(ENDED);
      });
    },
  );

  it("goes on, in the same room, when a student who stays active is changed", async () => {
    await inTestDatabase(async (db) => {
      const { staff, input, studentId, roomId } = await addPlacedCompanion(db);

      await changeStudent(db, staff, { ...input, name: "Sinta Uji Baru" });

      expect(await dutyOf(db, studentId)).toEqual({ isActive: true, roomId });
    });
  });

  it("ends, and the room is left, when the student is removed", async () => {
    await inTestDatabase(async (db) => {
      const { staff, studentId } = await addPlacedCompanion(db);

      const removed = await removeStudent(db, staff, NIM);

      expect(removed.ok).toBe(true);
      expect(await dutyOf(db, studentId)).toEqual(ENDED);
    });
  });
});
