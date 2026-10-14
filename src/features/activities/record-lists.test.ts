// Sample Tahun akademik of this file: 2260 to 2260.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readRecordActivities } from "./record-activities";
import { RECORD_SEARCH_LIMIT, searchRecordStudents } from "./record-student";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  addTestStudents,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2260, the program
 * UJICATATDAFTAR and the NIMs 9973200000 to 9973200099.
 */

const inTestDatabase = withTestDatabase();

const AT = new Date("2260-09-20T03:00:00Z");
const PROGRAM = "UJICATATDAFTAR";
const OTHERS = ROLE_IDS.filter((role) => role !== "upk_staff");

interface Records {
  staff: AccountForAccess;
  activityId: string;
  periodId: string;
  programId: number;
  /** A student of angkatan 2259, in semester 3 during Ganjil 2260. */
  student: TestStudentAccount;
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Daftar Catat", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id, {
    name: "Kegiatan uji daftar catat",
  });
  const periods = await addTestPeriods(db, 2260);
  const programId = await addTestProgram(db, PROGRAM);
  const student = await addTestStudentAccount(db, programId, {
    nim: "9973200001",
    name: "Sekar Uji Daftar Catat",
    cohortYear: 2259,
  });
  return {
    staff: accountOf(staff.id, staff.roles),
    activityId,
    periodId: periods.oddId,
    programId,
    student,
  };
}

function scheduleOn(records: Records, startsOn: string) {
  return {
    activityId: records.activityId,
    academicPeriodId: records.periodId,
    changedBy: records.staff.id,
    startsOn,
  };
}

describe("searchRecordStudents", () => {
  it("finds an Aktif student by part of the name or of the NIM", async () => {
    await inTestDatabase(async (db) => {
      const { staff, student } = await addRecords(db);
      const expected = [
        {
          id: student.studentId,
          name: "Sekar Uji Daftar Catat",
          nim: "9973200001",
          program: PROGRAM,
        },
      ];

      expect(await searchRecordStudents(db, staff, " uji daftar cat ")).toEqual(
        expected,
      );
      expect(await searchRecordStudents(db, staff, "73200001")).toEqual(
        expected,
      );
    });
  });

  it("leaves out a student who is on Cuti or Non aktif, and offers 10 at most, by name", async () => {
    await inTestDatabase(async (db) => {
      const { staff, programId } = await addRecords(db);
      await addTestStudents(db, programId, [
        {
          nim: "9973200002",
          name: "Sekar Uji Daftar Cuti",
          cohortYear: 2259,
          status: "on_leave",
        },
        {
          nim: "9973200003",
          name: "Sekar Uji Daftar Nonaktif",
          cohortYear: 2259,
          status: "inactive",
        },
        ...Array.from({ length: 11 }, (_, index) => ({
          nim: `99732000${String(index + 10)}`,
          name: `Arum Uji Daftar ${String(index + 10)}`,
          cohortYear: 2259,
        })),
      ]);

      const found = await searchRecordStudents(db, staff, "Uji Daftar");

      expect(found).toHaveLength(RECORD_SEARCH_LIMIT);
      expect(found[0]?.name).toBe("Arum Uji Daftar 10");
      expect(found.map(({ name }) => name)).not.toContain(
        "Sekar Uji Daftar Cuti",
      );
      expect(
        await searchRecordStudents(db, staff, "Uji Daftar Nonaktif"),
      ).toEqual([]);
    });
  });

  it("offers nobody for an empty or too long text, or for what is no text", async () => {
    await inTestDatabase(async (db) => {
      const { staff } = await addRecords(db);

      for (const query of ["", "   ", "a".repeat(101), undefined, 7, ["a"]]) {
        expect(await searchRecordStudents(db, staff, query)).toEqual([]);
      }
    });
  });

  it.each(OTHERS)(
    "offers nobody to a hand-made search sent by %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { staff } = await addRecords(db);
        const other = accountOf(staff.id, [role]);

        expect(await searchRecordStudents(db, other, "Uji Daftar")).toEqual([]);
      });
    },
  );
});

describe("readRecordActivities", () => {
  it("lists the student's activities that have started by today, the newest first, each with the status the student has there", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staff, student } = records;
      const older = await addTestSchedule(
        db,
        scheduleOn(records, "2260-09-01"),
      );
      const today = await addTestSchedule(
        db,
        scheduleOn(records, "2260-09-20"),
      );
      await addTestSchedule(db, scheduleOn(records, "2260-09-21"));
      await addTestAttendance(db, staff.id, {
        scheduleId: older,
        studentId: student.studentId,
        status: "rejected",
      });

      const listed = await readRecordActivities(
        db,
        staff,
        student.studentId,
        AT,
      );

      expect(listed).toEqual([
        {
          id: today,
          words: "20 Sep 2260 · Kegiatan uji daftar catat (Semester 3)",
          status: null,
        },
        {
          id: older,
          words: "1 Sep 2260 · Kegiatan uji daftar catat (Semester 3)",
          status: "rejected",
        },
      ]);
    });
  });

  it("leaves out a removed schedule and one meant for another semester", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staff, student } = records;
      await addTestSchedule(db, {
        ...scheduleOn(records, "2260-09-01"),
        deletedAt: AT,
        deletedBy: staff.id,
      });
      await addTestSchedule(db, {
        ...scheduleOn(records, "2260-09-02"),
        activityId: await addTestActivity(db, staff.id, { semester: 1 }),
      });

      expect(
        await readRecordActivities(db, staff, student.studentId, AT),
      ).toEqual([]);
    });
  });

  it("lists nothing for an unknown student or what is no key", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestSchedule(db, scheduleOn(records, "2260-09-01"));
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const studentId of [unknown, "bukan-kunci", undefined, 7]) {
        expect(
          await readRecordActivities(db, records.staff, studentId, AT),
        ).toEqual([]);
      }
    });
  });

  it.each(OTHERS)(
    "lists nothing for a hand-made request sent by %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const { student } = records;
        await addTestSchedule(db, scheduleOn(records, "2260-09-01"));
        // Even the student's own account, asking for itself.
        const other = { ...student, roles: [role] };

        expect(
          await readRecordActivities(db, other, student.studentId, AT),
        ).toEqual([]);
      });
    },
  );
});
