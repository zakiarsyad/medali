import { describe, expect, it } from "vitest";
import { activityAttendanceChanges, activityAttendances } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { decideAttendance } from "./decide-attendance";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "./test-records";

/*
 * Two decisions at the same moment need two connections that both see
 * the saved rows, and the log of decisions cannot be emptied. So this
 * check has a database of its own, dropped at the end. A second check
 * here must use records of its own, as the rows of the first stay.
 */
const own = withOwnTestDatabase("putusbareng");

describe("two Pegawai UPK deciding the same photo at the same moment", () => {
  it("keeps the first decision: the second waits, then is told it was decided, and writes no line", async () => {
    const one = await addTestActor(own.db, "Pegawai Putus Satu", ["upk_staff"]);
    const two = await addTestActor(own.db, "Pegawai Putus Dua", ["upk_staff"]);
    const activityId = await addTestActivity(own.db, one.id);
    const periods = await addTestPeriods(own.db, 2230);
    const programId = await addTestProgram(own.db, "UJIPUTUSBARENG");
    const student = await addTestStudentAccount(own.db, programId, {
      nim: "9972900001",
      name: "Mahasiswa Putus Bareng",
      cohortYear: 2229,
    });
    const scheduleId = await addTestSchedule(own.db, {
      activityId,
      academicPeriodId: periods.oddId,
      changedBy: one.id,
      startsOn: "2230-09-10",
    });
    const attendanceId = await addTestAttendance(own.db, one.id, {
      scheduleId,
      studentId: student.studentId,
      status: "waiting",
    });
    const at = new Date("2230-09-10T06:00:00Z");
    const staff = (id: string) => ({
      id,
      roles: ["upk_staff"] as const,
      studyProgramId: null,
      studentId: null,
    });

    const both = await own.atOnce(
      (db) =>
        decideAttendance(
          db,
          staff(one.id),
          attendanceId,
          { status: "valid" },
          at,
          true,
        ),
      (db) =>
        decideAttendance(
          db,
          staff(two.id),
          attendanceId,
          { status: "rejected", note: "Foto bukan dari kegiatan ini" },
          at,
          true,
        ),
    );

    expect(both.sooner.state.done).toBe("Presensi divalidasi.");
    expect(both.later.state).toEqual({
      error: "Presensi ini sudah diputuskan oleh petugas lain.",
      done: null,
    });
    expect(both.later.card).toMatchObject({
      status: "valid",
      decidedBy: "Pegawai Putus Satu",
    });
    const [kept] = await own.db.select().from(activityAttendances);
    expect(kept).toMatchObject({ status: "valid", decidedBy: one.id });
    const lines = await own.db.select().from(activityAttendanceChanges);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ changedBy: one.id, statusAfter: "valid" });
  });
});
