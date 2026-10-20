// Sample Tahun akademik of this file: 3902 to 3902.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, mayOpenTab } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activityAttendances } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActivity,
  addTestAttendance,
  addTestMentorGroup,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  TEST_DECIDED_AT,
} from "@/features/activities/test-records";
import { addTestScore } from "@/features/mentoring/test-scores";
import { addTestEntry } from "@/features/siku/test-siku";
import { addTestActor, addTestUpload } from "@/features/skpm/test-skpm";
import { START_PARAMS } from "./grade-address";
import { readGradeInputs } from "./grade-inputs";
import { type GradeRow, gradeListOf, gradeRowOf } from "./grade-list";
import { readGradeScheme } from "./grade-scheme";
import { gradeVisibleTo } from "./grade-students";
import { saveGradeScheme } from "./save-grade-scheme";
import { FORTY_TWENTY, sentWithWeights } from "./test-scheme";

/*
 * This file's own sample values: the Tahun akademik 3902, the programs
 * UJINILAIKARAKTER and UJINILAIKARAKTERB, and the NIMs 9987100200 to
 * 9987100299.
 */

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 3902/3903, which runs then. */
const TODAY = "3902-10-20";

const UPLOADED_AT = new Date("3902-10-10T03:00:00Z");

async function addRecords(db: Database) {
  const periods = await addTestPeriods(db, 3902);
  const programId = await addTestProgram(db, "UJINILAIKARAKTER");
  const otherProgramId = await addTestProgram(db, "UJINILAIKARAKTERB");
  const student = (program: number, nim: string, name: string) =>
    addTestStudentAccount(db, program, { nim, name, cohortYear: 3901 });
  const ani = await student(programId, "9987100201", "Ani Uji Nilai Karakter");
  const budi = await student(
    programId,
    "9987100202",
    "Budi Uji Nilai Karakter",
  );
  // Angkatan 3900 is in semester 5, which no schedule of the file is for.
  const citra = await addTestStudentAccount(db, otherProgramId, {
    nim: "9987100203",
    name: "Citra Uji Nilai Karakter",
    cohortYear: 3900,
  });
  const kepala = await addTestActor(db, "Kepala Uji Nilai Karakter", [
    "head_of_unit",
  ]);
  const mentor = await addTestActor(db, "Pengasuh Uji Nilai Karakter", [
    "mentor",
  ]);
  const kps = await addTestActor(
    db,
    "Kaprodi Uji Nilai Karakter",
    ["head_of_program"],
    { studyProgramId: programId },
  );
  await addTestMentorGroup(db, {
    studyProgramId: programId,
    cohortYear: 3901,
    number: 1,
    mentorId: mentor.id,
    memberIds: [ani.studentId],
  });
  return {
    periodId: periods.oddId,
    ani,
    budi,
    citra,
    kepala,
    mentor,
    kps,
    ids: [ani.studentId, budi.studentId, citra.studentId],
  };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

/** The rows of the file's own students that an account sees on the tab. */
async function rowsFor(
  db: Database,
  records: Records,
  account: AccountForAccess,
): Promise<GradeRow[]> {
  const { inputs } = await readGradeInputs(db, gradeVisibleTo(account), TODAY);
  const { scheme } = await readGradeScheme(db);
  return inputs
    .filter((input) => records.ids.includes(input.student.id))
    .map((input) => gradeRowOf(input, scheme));
}

async function aniRow(db: Database, records: Records): Promise<GradeRow> {
  const rows = await rowsFor(db, records, records.kepala);
  const row = rows.find((each) => each.student.id === records.ani.studentId);
  if (!row) throw new Error("Ani is not in the list.");
  return row;
}

/** Two closed schedules of Ani's semester: one valid, one still waiting. */
async function addAttendances(db: Database, records: Records) {
  const activityId = await addTestActivity(db, records.kepala.id);
  const schedule = (startsOn: string) =>
    addTestSchedule(db, {
      activityId,
      academicPeriodId: records.periodId,
      changedBy: records.kepala.id,
      startsOn,
    });
  const first = await schedule("3902-10-01");
  const second = await schedule("3902-10-02");
  const studentId = records.ani.studentId;
  await addTestAttendance(db, records.kepala.id, {
    scheduleId: first,
    studentId,
    status: "valid",
  });
  return addTestAttendance(db, records.kepala.id, {
    scheduleId: second,
    studentId,
    status: "waiting",
  });
}

function addSkpm(db: Database, records: Records) {
  return addTestUpload(db, records.kepala, {
    mode: "add",
    periodId: records.periodId,
    enteredAt: UPLOADED_AT,
    rows: [{ studentId: records.ani.studentId, points: 36 }],
  });
}

function addScore(db: Database, records: Records) {
  return addTestScore(db, {
    studentId: records.ani.studentId,
    periodId: records.periodId,
    score: 80,
    scoredBy: records.mentor.id,
  });
}

/** How many rows this transaction has added, changed or removed so far. */
async function writtenRows(db: Database): Promise<number> {
  const [written] = await db.execute<{ rows: string }>(
    sql`select coalesce(sum(n_tup_ins + n_tup_upd + n_tup_del), 0)::text as rows from pg_stat_xact_user_tables`,
  );
  return Number(written?.rows);
}

describe("the parts of the character grade", () => {
  it("reads each part where it is recorded, and gives the grade by the scheme", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAttendances(db, records);
      await addScore(db, records);
      await addSkpm(db, records);
      await addTestEntry(db, records.kepala, {
        kind: "gain",
        reason: "knowledge_sharing",
        points: 5,
        day: "3902-09-01",
        periodId: records.periodId,
        studentIds: [records.ani.studentId],
      });

      const rows = await rowsFor(db, records, records.kepala);

      const [ani, budi, citra] = rows;
      expect(ani).toMatchObject({
        attendance: { percent: 50, attended: 1, counted: 2 },
        mentoring: 80,
        siku: { score: 70, adjusted: true, note: "SIKU 65 +5" },
        skpm: 72,
        // 50, 80, 70 and 72 with 25% each.
        grade: { complete: true, final: 68, letter: "C", passes: false },
      });
      expect(budi).toMatchObject({
        attendance: { percent: 0, attended: 0, counted: 2 },
        mentoring: null,
        siku: { score: 65, adjusted: false, note: "SIKU dasar 65" },
        skpm: 0,
        grade: { complete: false },
      });
      expect(citra?.attendance).toEqual({
        percent: null,
        attended: 0,
        counted: 0,
      });
    });
  });

  it("leaves SKPM missing while no upload counts at all", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const row = await aniRow(db, records);

      expect(row.skpm).toBeNull();
      expect(row.grade).toEqual({ complete: false });
    });
  });

  it("shows the new grade on the next load after a part or the scheme changes", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const waiting = await addAttendances(db, records);
      await addScore(db, records);
      const finals: (number | null)[] = [];
      const load = async () => {
        const { grade } = await aniRow(db, records);
        finals.push(grade.complete ? grade.final : null);
      };

      await load();
      await addSkpm(db, records);
      await load();
      await db
        .update(activityAttendances)
        .set({
          status: "valid",
          decidedAt: TEST_DECIDED_AT,
          decidedBy: records.kepala.id,
        })
        .where(eq(activityAttendances.id, waiting));
      await load();
      await addTestEntry(db, records.kepala, {
        kind: "loss",
        reason: "student_violation",
        points: 5,
        day: "3902-10-05",
        periodId: records.periodId,
        studentIds: [records.ani.studentId],
      });
      await load();
      const { version } = await readGradeScheme(db);
      await saveGradeScheme(
        db,
        records.kepala,
        sentWithWeights(FORTY_TWENTY),
        version,
      );
      await load();

      // No upload; then 50, 80, 65, 72; the attendance verified, 100;
      // 5 SIKU points lost, 60; then weighted 40, 20, 20, 20.
      expect(finals).toEqual([null, 66.8, 79.3, 78, 82.4]);
    });
  });
});

describe("who sees which grades", () => {
  it("gives Kepala Unit every student, Ketua Program Studi their program and Pengasuh their mentees", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi, citra } = records;
      const idsFor = async (account: AccountForAccess) =>
        (await rowsFor(db, records, account)).map((row) => row.student.id);

      expect(await idsFor(records.kepala)).toEqual([
        ani.studentId,
        budi.studentId,
        citra.studentId,
      ]);
      expect(await idsFor(records.kps)).toEqual([
        ani.studentId,
        budi.studentId,
      ]);
      expect(await idsFor(records.mentor)).toEqual([ani.studentId]);
    });
  });

  it("finds nothing when Pengasuh searches by hand for a student outside their groups", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const rows = await rowsFor(db, records, records.mentor);
      const list = gradeListOf(rows, { ...START_PARAMS, query: "9987100203" });

      expect(list.matching).toBe(0);
    });
  });

  it("refuses the tab to a student and to Konselor, and shows them nobody", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const konselor = await addTestActor(db, "Konselor Uji Nilai Karakter", [
        "counsellor",
      ]);

      for (const account of [records.ani, konselor]) {
        expect(mayOpenTab(account.roles, "assessment", "character")).toBe(
          false,
        );
        expect(await rowsFor(db, records, account)).toEqual([]);
      }
    });
  });

  it("opens the tab to each role the spec names", () => {
    const roles: RoleId[] = [
      "head_of_unit",
      "director",
      "assessor",
      "head_of_program",
      "mentor",
    ];

    for (const role of roles) {
      expect(mayOpenTab([role], "assessment", "character")).toBe(true);
    }
  });

  it("writes nothing while the grades are read", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAttendances(db, records);
      await addScore(db, records);
      await addSkpm(db, records);
      const before = await writtenRows(db);
      // The count sees the rows this check added, so it would see more.
      expect(before).toBeGreaterThan(0);

      await rowsFor(db, records, records.kepala);

      expect(await writtenRows(db)).toBe(before);
    });
  });
});
