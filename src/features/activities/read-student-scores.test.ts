// Sample Tahun akademik of this file: 3900 to 3900.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestMeeting } from "@/mentoring/test-meetings";
import { readStudentScores } from "./read-student-scores";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestMentorGroup,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 3900, the program
 * UJINILAIHADIR and the NIMs 9987100000 to 9987100099.
 */

const inTestDatabase = withTestDatabase();

const TODAY = "3900-10-20";

async function addRecords(db: Database) {
  const staff = await addTestActor(db, "Pegawai Uji Nilai Hadir", [
    "upk_staff",
  ]);
  const mentor = await addTestActor(db, "Pengasuh Uji Nilai Hadir", ["mentor"]);
  const periods = await addTestPeriods(db, 3900);
  const programId = await addTestProgram(db, "UJINILAIHADIR");
  const student = (nim: string, name: string) =>
    addTestStudentAccount(db, programId, { nim, name, cohortYear: 3899 });
  const ani = await student("9987100001", "Ani Uji Nilai Hadir");
  const budi = await student("9987100002", "Budi Uji Nilai Hadir");
  const citra = await student("9987100003", "Citra Uji Nilai Hadir");
  return {
    staff,
    mentor,
    periodId: periods.oddId,
    programId,
    everyone: eq(students.studyProgramId, programId),
    ani: ani.studentId,
    budi: budi.studentId,
    citra: citra.studentId,
  };
}

describe("readStudentScores", () => {
  it("gives each student attended of counted, activities and meetings together", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staff, ani, budi, citra, periodId } = records;
      const activityId = await addTestActivity(db, staff.id);
      for (const startsOn of ["3900-10-01", "3900-10-02"]) {
        const scheduleId = await addTestSchedule(db, {
          activityId,
          academicPeriodId: periodId,
          changedBy: staff.id,
          startsOn,
        });
        await addTestAttendance(db, staff.id, {
          scheduleId,
          studentId: ani,
          status: "valid",
        });
      }
      const groupId = await addTestMentorGroup(db, {
        studyProgramId: records.programId,
        cohortYear: 3899,
        number: 1,
        mentorId: records.mentor.id,
        memberIds: [ani, budi],
      });
      const meeting = {
        groupId,
        periodId,
        number: 1,
        savedBy: records.mentor.id,
      };
      await addTestMeeting(db, meeting, { [ani]: "absent", [budi]: "present" });

      const scores = await readStudentScores(db, records.everyone, TODAY);

      expect(scores.get(ani)).toEqual({ attended: 2, counted: 3 });
      expect(scores.get(budi)).toEqual({ attended: 1, counted: 3 });
      expect(scores.get(citra)).toEqual({ attended: 0, counted: 2 });
    });
  });

  it("counts nothing of a schedule that has not started, not even a valid photo, as on the student's own page", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staff, ani, periodId } = records;
      const scheduleId = await addTestSchedule(db, {
        activityId: await addTestActivity(db, staff.id),
        academicPeriodId: periodId,
        changedBy: staff.id,
        startsOn: "3900-10-21",
      });
      await addTestAttendance(db, staff.id, {
        scheduleId,
        studentId: ani,
        status: "valid",
      });

      const before = await readStudentScores(db, records.everyone, TODAY);
      const onTheDay = await readStudentScores(
        db,
        records.everyone,
        "3900-10-21",
      );

      expect(before.get(ani)).toEqual({ attended: 0, counted: 0 });
      expect(onTheDay.get(ani)).toEqual({ attended: 1, counted: 1 });
    });
  });

  it("gives nobody a score on a day before the first period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const scores = await readStudentScores(
        db,
        records.everyone,
        "3900-07-01",
      );

      expect(scores.size).toBe(0);
    });
  });

  it("leaves out a student the account does not see", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const scores = await readStudentScores(
        db,
        eq(students.id, records.ani),
        TODAY,
      );

      expect([...scores.keys()]).toEqual([records.ani]);
    });
  });
});
