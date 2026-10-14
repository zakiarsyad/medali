// Sample Tahun akademik of this file: 2750 to 2750.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  readClassCounts,
  readPickedStudents,
  searchParticipantStudents,
} from "./participant-pool";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudents,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2750, the program
 * UJIPESERTAFORM, the classes PF-01 and PF-02 and the NIMs 9974660000 to
 * 9974660099.
 */

const inTestDatabase = withTestDatabase();

const MAY_MANAGE: RoleId[] = ["head_of_unit", "upk_staff"];
const MAY_NOT_MANAGE = ROLE_IDS.filter((role) => !MAY_MANAGE.includes(role));

async function addStudents(db: Database): Promise<Map<string, string>> {
  const programId = await addTestProgram(db, "UJIPESERTAFORM");
  await addTestStudents(db, programId, [
    {
      nim: "9974660001",
      name: "Uji Peserta Form Satu",
      cohortYear: 2750,
      className: "PF-01",
    },
    {
      nim: "9974660002",
      name: "Uji Peserta Form Dua",
      cohortYear: 2750,
      className: "PF-01",
    },
    {
      nim: "9974660003",
      name: "Uji Peserta Form Tiga",
      cohortYear: 2750,
      className: "PF-02",
      status: "inactive",
    },
  ]);
  const stored = await db
    .select({ id: students.id, nim: students.nim })
    .from(students)
    .where(eq(students.studyProgramId, programId));
  return new Map(stored.map(({ id, nim }) => [nim, id]));
}

describe("readClassCounts", () => {
  it("counts the Aktif students of each class, and leaves out a class with none", async () => {
    await inTestDatabase(async (db) => {
      await addStudents(db);

      const counts = await readClassCounts(db);

      const own = counts.filter((row) => row.className.startsWith("PF-"));
      expect(own).toEqual([{ className: "PF-01", students: 2 }]);
    });
  });
});

describe("readPickedStudents", () => {
  it("names the students a schedule picks one by one, with whether each is Aktif", async () => {
    await inTestDatabase(async (db) => {
      const idsByNim = await addStudents(db);
      const staff = await addTestActor(db, "Pegawai Uji Peserta Form", [
        "upk_staff",
      ]);
      const activityId = await addTestActivity(db, staff.id, {
        semester: null,
      });
      const periods = await addTestPeriods(db, 2750);
      const scheduleId = await addTestSchedule(db, {
        activityId,
        academicPeriodId: periods.oddId,
        changedBy: staff.id,
        startsOn: "2750-09-10",
      });
      const picked = ["9974660003", "9974660001"].map(
        (nim) => idsByNim.get(nim) ?? "",
      );
      await db
        .insert(activityScheduleParticipants)
        .values(picked.map((studentId) => ({ scheduleId, studentId })));

      const read = await readPickedStudents(db, [scheduleId]);

      expect(read).toEqual({
        [scheduleId]: [
          {
            id: picked[1],
            name: "Uji Peserta Form Satu",
            nim: "9974660001",
            isActive: true,
          },
          {
            id: picked[0],
            name: "Uji Peserta Form Tiga",
            nim: "9974660003",
            isActive: false,
          },
        ],
      });
    });
  });

  it("reads nothing for no schedule", async () => {
    await inTestDatabase(async (db) => {
      expect(await readPickedStudents(db, [])).toEqual({});
    });
  });
});

describe("searchParticipantStudents", () => {
  it.each(MAY_MANAGE)(
    "offers %s the Aktif students whose name or NIM holds the text",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addStudents(db);
        const actor = await addTestActor(db, "Pengelola Uji", [role]);
        const account = { ...actor, studyProgramId: null, studentId: null };

        const found = await searchParticipantStudents(
          db,
          account,
          "Uji Peserta Form",
        );

        expect(found.map((student) => student.nim)).toEqual([
          "9974660002",
          "9974660001",
        ]);
      });
    },
  );

  it.each(MAY_NOT_MANAGE)("offers %s nobody", async (role) => {
    await inTestDatabase(async (db) => {
      await addStudents(db);
      const actor = await addTestActor(db, "Bukan Pengelola Uji", [role]);
      const account = { ...actor, studyProgramId: null, studentId: null };

      expect(
        await searchParticipantStudents(db, account, "Uji Peserta Form"),
      ).toEqual([]);
    });
  });
});
