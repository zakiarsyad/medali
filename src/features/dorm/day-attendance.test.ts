// Sample Tahun akademik of this file: 2730 to 2730.
// Sample NIMs of this file: 9937770000 to 9937770099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readDayAttendance } from "./day-attendance";
import { removeActivity } from "./remove-activity";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import { addTestActor, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

/* Angkatan 2730 is in semester 1 in this period, so it lives in the dorm. */
const ODD_2730 = {
  startYear: 2730,
  term: "odd",
  startsOn: "2730-08-01",
  endsOn: "2731-01-31",
} as const;
const DAY = "2730-10-14";
const FROM = { startsOn: "2730-08-01" };
// 10:00 on campus on 14 October 2730.
const MOMENT = new Date("2730-10-14T03:00:00Z");

async function addRecords(db: Database) {
  await db.insert(academicPeriods).values(ODD_2730);
  const own = await addTestProgram(db, "Prodi Uji Rekap Hadir");
  const other = await addTestProgram(db, "Prodi Uji Rekap Lain");
  const student = (program: number, nim: string, name: string) =>
    addTestStudent(db, program, { nim, name, cohortYear: 2730 });
  const ani = await student(own, "9937770001", "Ani Rekap Uji");
  const budi = await student(own, "9937770002", "Budi Rekap Uji");
  const cici = await student(other, "9937770003", "Cici Rekap Uji");
  const counter = await addTestActor(db, "BAM Uji Rekap", ["bam_bphk"]);
  const activityId = await addTestActivity(db, counter.id, {
    versions: [FROM],
  });
  return { own, ani, budi, cici, counter, activityId };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

function count(records: Records, isAnnouncement: boolean) {
  return {
    activityId: records.activityId,
    day: DAY,
    version: 0,
    isAnnouncement,
    marks: {
      [records.ani]: { isAbsent: true, note: "Sakit" },
      [records.budi]: { isAbsent: false, note: "Terlambat" },
      [records.cici]: { isAbsent: true, note: "" },
    },
  };
}

describe("readDayAttendance", () => {
  it("gives each announced count of the day with who announced it, Hadir and Tidak hadir, and those absent or noted by name", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await saveCount(db, records.counter, count(records, true), MOMENT);

      const shown = await readDayAttendance(db, DAY, EVERYONE);

      expect(shown[records.activityId]).toMatchObject({
        announcedBy: "BAM Uji Rekap",
        present: 1,
        absent: 2,
        marked: [
          { name: "Ani Rekap Uji", isAbsent: true, note: "Sakit" },
          { name: "Budi Rekap Uji", isAbsent: false, note: "Terlambat" },
          { name: "Cici Rekap Uji", isAbsent: true, note: "" },
        ],
      });
      expect(await readDayAttendance(db, "2730-10-13", EVERYONE)).toEqual({});
    });
  });

  it("leaves out a draft, which counts for no one", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await saveCount(db, records.counter, count(records, false), MOMENT);

      expect(await readDayAttendance(db, DAY, EVERYONE)).toEqual({});
    });
  });

  it("counts and lists only the students of their own program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await saveCount(db, records.counter, count(records, true), MOMENT);

      const shown = await readDayAttendance(
        db,
        DAY,
        eq(students.studyProgramId, records.own),
      );

      const attendance = shown[records.activityId];
      expect(attendance).toMatchObject({ present: 1, absent: 1 });
      expect(attendance?.marked.map((row) => row.name)).toEqual([
        "Ani Rekap Uji",
        "Budi Rekap Uji",
      ]);
    });
  });

  it("keeps the count of an activity removed after it was announced", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await saveCount(db, records.counter, count(records, true), MOMENT);
      const manager = await addTestActor(db, "Pengelola Uji Rekap", [
        "dorm_manager",
      ]);
      await removeActivity(db, manager, records.activityId, DAY);

      const shown = await readDayAttendance(db, DAY, EVERYONE);

      expect(shown[records.activityId]).toMatchObject({
        present: 1,
        absent: 2,
      });
    });
  });
});
