// Sample Tahun akademik of this file: 3140 to 3141.
import { eq, type SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rowLimitForTab } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { AttendanceMark } from "@/mentoring/meeting-ids";
import { addTestMeeting } from "@/mentoring/test-meetings";
import { readMeanScore } from "./read-mean-score";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestMentorGroup,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestActor,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 3140 and 3141, the
 * program UJIRERATATEMU and the NIMs 9979100000 to 9979100099.
 */

const inTestDatabase = withTestDatabase();

const TODAY = "3141-10-20";

interface Records {
  mentor: TestActor;
  programId: number;
  /** Ganjil 3141/3142, which runs today. */
  periodId: string;
  /** The students of the program, as a role that sees every student would. */
  everyone: SQL;
  /** Two students of angkatan 3140, in semester 3 during Ganjil 3141. */
  ani: TestStudentAccount;
  budi: TestStudentAccount;
}

async function addRecords(db: Database): Promise<Records> {
  const mentor = await addTestActor(db, "Pengasuh Uji Rerata Temu", ["mentor"]);
  const periods = await addTestPeriods(db, 3141);
  const programId = await addTestProgram(db, "UJIRERATATEMU");
  const ani = await addTestStudentAccount(db, programId, {
    nim: "9979100001",
    name: "Ani Uji Rerata Temu",
    cohortYear: 3140,
  });
  const budi = await addTestStudentAccount(db, programId, {
    nim: "9979100002",
    name: "Budi Uji Rerata Temu",
    cohortYear: 3140,
  });
  return {
    mentor,
    programId,
    periodId: periods.oddId,
    everyone: eq(students.studyProgramId, programId),
    ani,
    budi,
  };
}

/** A group of angkatan 3140 held by the mentor of the records. */
function addGroupOf(
  db: Database,
  records: Records,
  memberIds: string[],
  number = 1,
  mentorId = records.mentor.id,
): Promise<string> {
  return addTestMentorGroup(db, {
    studyProgramId: records.programId,
    cohortYear: 3140,
    number,
    mentorId,
    memberIds,
  });
}

/** A saved meeting of a group in the running period, with these marks. */
function addMeeting(
  db: Database,
  records: Records,
  groupId: string,
  number: number,
  marks: Record<string, AttendanceMark>,
): Promise<string> {
  const meeting = {
    groupId,
    periodId: records.periodId,
    number,
    savedBy: records.mentor.id,
  };
  return addTestMeeting(db, meeting, marks);
}

describe("readMeanScore with mentoring meetings", () => {
  it("counts each student's marks at the meetings of the running period with their activities", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi } = records;
      const staff = await addTestActor(db, "Pegawai Uji Rerata Temu", [
        "upk_staff",
      ]);
      const activityId = await addTestActivity(db, staff.id);
      const scheduleId = await addTestSchedule(db, {
        activityId,
        academicPeriodId: records.periodId,
        changedBy: staff.id,
        startsOn: "3141-10-01",
      });
      await addTestAttendance(db, staff.id, {
        scheduleId,
        studentId: ani.studentId,
        status: "valid",
      });
      const groupId = await addGroupOf(db, records, [
        ani.studentId,
        budi.studentId,
      ]);
      await addMeeting(db, records, groupId, 1, {
        [ani.studentId]: "present",
        [budi.studentId]: "present",
      });

      const mean = await readMeanScore(db, records.everyone, TODAY);

      // Ani 2 of 2, Budi 1 of 2.
      expect(mean).toEqual({ percent: 75, students: 2 });
    });
  });

  it("counts the meetings when the running period has no schedule, leaving Izin and Sakit out", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi } = records;
      const cici = await addTestStudentAccount(db, records.programId, {
        nim: "9979100003",
        name: "Cici Uji Rerata Temu",
        cohortYear: 3140,
      });
      const groupId = await addGroupOf(db, records, [
        ani.studentId,
        budi.studentId,
        cici.studentId,
      ]);
      await addMeeting(db, records, groupId, 1, {
        [ani.studentId]: "present",
        [budi.studentId]: "absent",
        [cici.studentId]: "excused",
      });
      await addMeeting(db, records, groupId, 2, {
        [ani.studentId]: "present",
        [budi.studentId]: "present",
        [cici.studentId]: "sick",
      });

      const mean = await readMeanScore(db, records.everyone, TODAY);

      // Ani at 100 and Budi at 50; Cici has nothing counted.
      expect(mean).toEqual({ percent: 75, students: 2 });
    });
  });

  it("counts no meeting whose saved list does not hold the student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi } = records;
      const groupId = await addGroupOf(db, records, [
        ani.studentId,
        budi.studentId,
      ]);
      await addMeeting(db, records, groupId, 1, {
        [ani.studentId]: "absent",
      });

      const mean = await readMeanScore(db, records.everyone, TODAY);

      expect(mean).toEqual({ percent: 0, students: 1 });
    });
  });

  it("counts the meetings of both groups of a student who moved, each once", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani } = records;
      const left = await addGroupOf(db, records, [], 1);
      const joined = await addGroupOf(db, records, [ani.studentId], 2);
      await addMeeting(db, records, left, 1, { [ani.studentId]: "present" });
      await addMeeting(db, records, joined, 1, { [ani.studentId]: "absent" });
      await addMeeting(db, records, joined, 2, { [ani.studentId]: "absent" });
      await addMeeting(db, records, joined, 3, { [ani.studentId]: "present" });

      const mean = await readMeanScore(db, records.everyone, TODAY);

      expect(mean).toEqual({ percent: 50, students: 1 });
    });
  });

  it("counts only the meetings of the running period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani } = records;
      const earlier = await addTestPeriods(db, 3140);
      const groupId = await addGroupOf(db, records, [ani.studentId]);
      await addTestMeeting(
        db,
        {
          groupId,
          periodId: earlier.oddId,
          number: 1,
          savedBy: records.mentor.id,
        },
        { [ani.studentId]: "present" },
      );
      await addMeeting(db, records, groupId, 1, { [ani.studentId]: "absent" });

      const mean = await readMeanScore(db, records.everyone, TODAY);

      expect(mean).toEqual({ percent: 0, students: 1 });
    });
  });

  it("leaves out a student who is not Aktif, with their meetings", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const onLeave = await addTestStudentAccount(db, records.programId, {
        nim: "9979100004",
        name: "Dodi Uji Rerata Temu",
        cohortYear: 3140,
        status: "on_leave",
      });
      const groupId = await addGroupOf(db, records, [onLeave.studentId]);
      await addMeeting(db, records, groupId, 1, {
        [onLeave.studentId]: "present",
      });

      const mean = await readMeanScore(db, records.everyone, TODAY);

      expect(mean).toEqual({ percent: null, students: 0 });
    });
  });

  it("gives Pengasuh the mean of their own mentees only, and a student none", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi } = records;
      const otherMentor = await addTestActor(db, "Pengasuh Uji Rerata Lain", [
        "mentor",
      ]);
      const own = await addGroupOf(db, records, [ani.studentId], 1);
      const other = await addGroupOf(
        db,
        records,
        [budi.studentId],
        2,
        otherMentor.id,
      );
      await addMeeting(db, records, own, 1, { [ani.studentId]: "present" });
      await addMeeting(db, records, other, 1, { [budi.studentId]: "absent" });
      const mentor = {
        ...records.mentor,
        studyProgramId: null,
        studentId: null,
      };
      const ofMentor = visibleTo(rowLimitForTab(mentor, "activities", "extra"));
      const ofStudent = visibleTo(rowLimitForTab(ani, "activities", "extra"));

      expect(await readMeanScore(db, ofMentor, TODAY)).toEqual({
        percent: 100,
        students: 1,
      });
      expect(await readMeanScore(db, ofStudent, TODAY)).toEqual({
        percent: null,
        students: 0,
      });
    });
  });
});
