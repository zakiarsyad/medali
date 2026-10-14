import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import {
  activityAttendanceChanges,
  activityAttendances,
  activityClarificationChanges,
  activityClarifications,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { decideClarification } from "./decide-clarification";
import { recordAttendance } from "./record-attendance";
import {
  addTestActivity,
  addTestActor,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "./test-records";

/*
 * Two decisions at the same moment need two connections that both see
 * the saved rows, and the logs of decisions cannot be emptied. So these
 * checks have a database of their own, dropped at the end, and each
 * check uses records of its own: the Tahun akademik 2300 and 2310, and
 * the NIMs 9974300000 to 9974300099.
 */
const own = withOwnTestDatabase("klarbareng");

function accountOf(id: string, role: "assessor" | "upk_staff") {
  const account: AccountForAccess = {
    id,
    roles: [role],
    studyProgramId: null,
    studentId: null,
  };
  return account;
}

/** A clarification that waits, of a student with nothing sent for a schedule that has started. */
async function addRecords(year: number, program: string, nim: string) {
  const one = await addTestActor(own.db, `Penilai Satu ${program}`, [
    "assessor",
  ]);
  const two = await addTestActor(own.db, `Penilai Dua ${program}`, [
    "assessor",
  ]);
  const staff = await addTestActor(own.db, `Pegawai ${program}`, ["upk_staff"]);
  const activityId = await addTestActivity(own.db, one.id);
  const periods = await addTestPeriods(own.db, year);
  const programId = await addTestProgram(own.db, program);
  const student = await addTestStudentAccount(own.db, programId, {
    nim,
    name: `Mahasiswa ${program}`,
    cohortYear: year - 1,
  });
  const scheduleId = await addTestSchedule(own.db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: one.id,
    startsOn: `${year}-10-10`,
  });
  const clarificationId = await addTestClarification(own.db, one.id, {
    scheduleId,
    studentId: student.studentId,
    status: "submitted",
  });
  return {
    one: accountOf(one.id, "assessor"),
    two: accountOf(two.id, "assessor"),
    staff: accountOf(staff.id, "upk_staff"),
    student,
    scheduleId,
    clarificationId,
    at: new Date(`${year}-10-13T03:00:00Z`),
  };
}

function keptFor(scheduleId: string) {
  return own.db
    .select()
    .from(activityAttendances)
    .where(eq(activityAttendances.scheduleId, scheduleId));
}

function linesOf(clarificationId: string) {
  return own.db
    .select()
    .from(activityClarificationChanges)
    .where(eq(activityClarificationChanges.clarificationId, clarificationId));
}

describe("two Penilai Mahasiswa deciding the same clarification at the same moment", () => {
  it("keeps the first decision: the second waits, then is told it was decided, and changes nothing", async () => {
    const records = await addRecords(2300, "UJIKLARBARENG", "9974300001");
    const { clarificationId, at } = records;

    const both = await own.atOnce(
      (db) =>
        decideClarification(
          db,
          records.one,
          { clarificationId, kind: "present", note: "" },
          at,
          true,
        ),
      (db) =>
        decideClarification(
          db,
          records.two,
          { clarificationId, kind: "reject", note: "Lampiran tidak terbaca." },
          at,
          true,
        ),
    );

    expect(both.sooner.state.done).toBe(
      "Klarifikasi diterima; status kehadiran diperbarui.",
    );
    expect(both.later.state).toEqual({
      error: "Klarifikasi ini sudah diputuskan oleh petugas lain.",
      done: null,
    });
    expect(both.later.card).toMatchObject({
      status: "accepted",
      decision: { result: "Diterima sebagai hadir" },
    });
    const [kept] = await own.db
      .select()
      .from(activityClarifications)
      .where(eq(activityClarifications.id, clarificationId));
    expect(kept).toMatchObject({
      status: "accepted",
      note: "",
      decidedBy: records.one.id,
    });
    const lines = await linesOf(clarificationId);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      changedBy: records.one.id,
      statusAfter: "accepted",
    });
    expect(await keptFor(records.scheduleId)).toMatchObject([
      { status: "valid", decidedBy: records.one.id },
    ]);
  });
});

describe("an acceptance and a record made by hand for the same student and schedule at the same moment", () => {
  it("keeps one attendance: the acceptance waits for the record, then is refused because the attendance already counts", async () => {
    const records = await addRecords(2310, "UJIKLARCATAT", "9974300002");
    const { clarificationId, at } = records;
    const record = {
      studentId: records.student.studentId,
      scheduleId: records.scheduleId,
      kind: "sick",
      note: "Surat dokter contoh",
      replaces: null,
    };

    const both = await own.atOnce<{ state: { error: string | null } }>(
      (db) => recordAttendance(db, records.staff, record, at),
      (db) =>
        decideClarification(
          db,
          records.one,
          { clarificationId, kind: "present", note: "" },
          at,
          true,
        ),
    );

    expect(both.sooner.state.error).toBeNull();
    expect(both.later.state.error).toBe(
      "Kehadiran mahasiswa ini sudah berstatus Dispensasi pada kegiatan ini, sehingga klarifikasi tidak dapat diterima. Tolak dengan catatan bila perlu.",
    );
    const kept = await keptFor(records.scheduleId);
    expect(kept).toMatchObject([
      { status: "dispensation", decidedBy: records.staff.id },
    ]);
    const lines = await own.db
      .select()
      .from(activityAttendanceChanges)
      .where(eq(activityAttendanceChanges.attendanceId, kept[0]?.id ?? ""));
    expect(lines).toHaveLength(1);
    expect(await linesOf(clarificationId)).toEqual([]);
  });
});
