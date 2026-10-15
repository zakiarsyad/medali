// Sample Tahun akademik of this file: 3800 to 3800.
// Sample NIMs of this file: 9938000000 to 9938000099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, dormLeaves, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { loadDashboard } from "./dashboard-view";
import { readDayAttendance } from "./day-attendance";
import { addTestActivity } from "./test-activities";
import { addTestClarification, addTestCount } from "./test-clarifications";
import { addTestActor, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

/* Angkatan 3800 is in semester 1 in this period, so it lives in the dorm. */
const ODD_3800 = {
  startYear: 3800,
  term: "odd",
  startsOn: "3800-08-01",
  endsOn: "3801-01-31",
} as const;
const TODAY = "3800-10-14";
const YESTERDAY = "3800-10-13";
// 10:00 on campus on 14 October 3800.
const MOMENT = new Date("3800-10-14T03:00:00Z");

async function addRecords(db: Database) {
  await db.insert(academicPeriods).values(ODD_3800);
  const own = await addTestProgram(db, "Prodi Uji Dashboard Asrama");
  const other = await addTestProgram(db, "Prodi Uji Dashboard Lain");
  const student = (
    program: number,
    nim: string,
    sex: "female" | "male" = "female",
  ) =>
    addTestStudent(db, program, {
      nim,
      name: `Penghuni Uji Dashboard ${nim.slice(-2)}`,
      cohortYear: 3800,
      sex,
    });
  const ani = await student(own, "9938000001");
  const budi = await student(own, "9938000002", "male");
  const cici = await student(other, "9938000003");
  const dedi = await student(other, "9938000004", "male");
  const counter = await addTestActor(db, "BAM Uji Dashboard", ["bam_bphk"]);
  const activityId = await addTestActivity(db, counter.id, {
    versions: [{ startsOn: "3800-08-01" }],
  });
  return { own, ani, budi, cici, dedi, counter, activityId };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

function leaveOf(
  records: Records,
  studentId: string,
  more: Partial<typeof dormLeaves.$inferInsert>,
) {
  return {
    id: crypto.randomUUID(),
    studentId,
    kind: "outing" as const,
    startsAt: new Date(`${TODAY}T08:00:00+07:00`),
    endsAt: new Date(`${TODAY}T16:00:00+07:00`),
    purpose: "Membeli buku kuliah",
    destination: "Bintaro",
    contact: "",
    status: "approved" as const,
    sentAt: MOMENT,
    decidedBy: records.counter.id,
    decidedAt: MOMENT,
    ...more,
  };
}

/** Yesterday's count: Ani and Dedi absent, Budi and Cici present. */
function addYesterdaysCount(db: Database, records: Records) {
  return addTestCount(db, {
    activityId: records.activityId,
    day: YESTERDAY,
    byId: records.counter.id,
    marks: {
      [records.ani]: { isAbsent: true, note: "" },
      [records.budi]: { isAbsent: false, note: "" },
      [records.cici]: { isAbsent: false, note: "" },
      [records.dedi]: { isAbsent: true, note: "" },
    },
  });
}

const OWN_PROGRAM = (records: Records) =>
  eq(students.studyProgramId, records.own);

describe("loadDashboard", () => {
  it("counts the residents of each dorm today", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      const view = await loadDashboard(db, { visible: EVERYONE }, MOMENT);

      expect(view.residents).toMatchObject({ dana_rakca: 2, cipta_bakti: 2 });
    });
  });

  it("counts those out now, those of them late, and the requests that wait, as Perizinan asrama does", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await db.insert(dormLeaves).values([
        leaveOf(records, records.ani, {}),
        leaveOf(records, records.budi, {
          startsAt: new Date(`${TODAY}T05:00:00+07:00`),
          endsAt: new Date(`${TODAY}T09:00:00+07:00`),
        }),
        leaveOf(records, records.cici, {
          status: "submitted",
          decidedBy: null,
          decidedAt: null,
        }),
        leaveOf(records, records.dedi, {
          kind: "skip_activities",
          destination: "",
        }),
      ]);

      const view = await loadDashboard(db, { visible: EVERYONE }, MOMENT);

      expect(view.leave).toEqual({ out: 2, outLate: 1, waiting: 1 });
    });
  });

  it("counts Kehadiran 7 hari terakhir over the announced activities that are over, with leave and accepted clarifications applied as Kegiatan asrama does", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const countId = await addYesterdaysCount(db, records);
      await db.insert(dormLeaves).values(
        leaveOf(records, records.ani, {
          startsAt: new Date(`${YESTERDAY}T05:00:00+07:00`),
          endsAt: new Date(`${YESTERDAY}T07:00:00+07:00`),
          status: "completed",
          returnedAt: new Date(`${YESTERDAY}T07:00:00+07:00`),
        }),
      );
      await addTestClarification(db, records.counter.id, {
        countId,
        studentId: records.dedi,
        status: "accepted",
      });

      const view = await loadDashboard(db, { visible: EVERYONE }, MOMENT);
      const shown = await readDayAttendance(db, YESTERDAY, EVERYONE);

      expect(view.overall).toEqual({
        attendance: { present: 3, absent: 0, leave: 1 },
        activities: 1,
      });
      expect(shown[records.activityId]).toMatchObject({
        present: 3,
        absent: 0,
      });
    });
  });

  it("leaves out today's activity until it is over, and a draft", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const evening = await addTestActivity(db, records.counter.id, {
        versions: [
          { startsOn: "3800-08-01", startTime: "21:00", endTime: "21:30" },
        ],
      });
      const marks = { [records.ani]: { isAbsent: true, note: "" } };
      await addTestCount(db, {
        activityId: evening,
        day: TODAY,
        byId: records.counter.id,
        marks,
      });
      await addTestCount(db, {
        activityId: records.activityId,
        day: YESTERDAY,
        byId: records.counter.id,
        marks,
        isAnnounced: false,
      });

      const view = await loadDashboard(db, { visible: EVERYONE }, MOMENT);

      expect(view.overall.activities).toBe(0);
    });
  });

  it("is right again the next time it is read, after an absence is announced and leave approved", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const before = await loadDashboard(db, { visible: EVERYONE }, MOMENT);
      await addYesterdaysCount(db, records);
      await db.insert(dormLeaves).values(leaveOf(records, records.ani, {}));

      const after = await loadDashboard(db, { visible: EVERYONE }, MOMENT);

      expect(before.overall.activities).toBe(0);
      expect(before.leave.out).toBe(0);
      expect(after.overall).toEqual({
        attendance: { present: 2, absent: 2, leave: 0 },
        activities: 1,
      });
      expect(after.leave.out).toBe(1);
    });
  });

  it("counts only the students of their own program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addYesterdaysCount(db, records);
      await db
        .insert(dormLeaves)
        .values([
          leaveOf(records, records.ani, {}),
          leaveOf(records, records.cici, {}),
        ]);

      const view = await loadDashboard(
        db,
        { visible: OWN_PROGRAM(records) },
        MOMENT,
      );

      expect(view.residents).toMatchObject({ dana_rakca: 1, cipta_bakti: 1 });
      expect(view.leave.out).toBe(1);
      expect(view.overall.attendance).toEqual({
        present: 1,
        absent: 1,
        leave: 0,
      });
    });
  });
});
