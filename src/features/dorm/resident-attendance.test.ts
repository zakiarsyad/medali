// Sample Tahun akademik of this file: 2740 to 2740.
// Sample NIMs of this file: 9937790000 to 9937790099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { CountInput } from "./count-input";
import { removeActivity } from "./remove-activity";
import { readOwnAttendance } from "./resident-attendance";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/* Angkatan 2740 is in semester 1 in this period, so it lives in the dorm. */
const ODD_2740 = {
  startYear: 2740,
  term: "odd",
  startsOn: "2740-08-01",
  endsOn: "2741-01-31",
} as const;
const TODAY = "2740-10-14";
const YESTERDAY = "2740-10-13";
const FROM = { startsOn: "2740-10-13" };
// 23:00 on campus on 14 October 2740: every activity of the day is over.
const NIGHT = new Date("2740-10-14T16:00:00Z");

async function addRecords(db: Database) {
  await db.insert(academicPeriods).values(ODD_2740);
  const program = await addTestProgram(db, "Prodi Uji Riwayat Asrama");
  const student = (nim: string, name: string, more = {}) =>
    addTestStudent(db, program, { nim, name, cohortYear: 2740, ...more });
  const ani = await student("9937790001", "Ani Riwayat Uji");
  const budi = await student("9937790002", "Budi Riwayat Uji");
  const senior = await student("9937790003", "Senior Riwayat Uji", {
    cohortYear: 2739,
  });
  const counter = await addTestActor(db, "BAM Uji Riwayat", ["bam_bphk"]);
  // Apel pagi 05:30 to 06:15, every day from yesterday on.
  const morning = await addTestActivity(db, counter.id, { versions: [FROM] });
  const evening = await addTestActivity(db, counter.id, {
    versions: [
      {
        ...FROM,
        name: "Belajar malam uji",
        startTime: "19:30",
        endTime: "21:00",
      },
    ],
  });
  return { ani, budi, senior, counter, morning, evening };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

async function count(
  db: Database,
  records: Records,
  input: Pick<CountInput, "activityId" | "day" | "marks">,
  isAnnouncement = true,
) {
  const saved = await saveCount(
    db,
    records.counter,
    { ...input, version: 0, isAnnouncement },
    NIGHT,
  );
  expect(saved.ok).toBe(true);
}

function residentOf(studentId: string | null, roles: RoleId[] = ["student"]) {
  return { roles, studentId };
}

describe("readOwnAttendance", () => {
  it("gives the resident's numbers and Riwayat: Hadir, Tidak hadir with the note, and Belum diumumkan for a draft and for one not counted", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi, morning, evening } = records;
      await count(db, records, {
        activityId: morning,
        day: YESTERDAY,
        marks: { [ani]: { isAbsent: true, note: "Sakit" } },
      });
      await count(db, records, {
        activityId: evening,
        day: YESTERDAY,
        marks: { [budi]: { isAbsent: true, note: "" } },
      });
      await count(
        db,
        records,
        { activityId: morning, day: TODAY, marks: {} },
        false,
      );

      const answer = await readOwnAttendance(db, residentOf(ani), NIGHT);

      if (answer.kind !== "shown") throw new Error("It was refused.");
      expect(answer.attendance.present).toBe(1);
      expect(answer.attendance.absent).toBe(1);
      expect(
        answer.attendance.history.map(({ day, name, status, note }) => ({
          day,
          name,
          status,
          note,
        })),
      ).toEqual([
        {
          day: TODAY,
          name: "Belajar malam uji",
          status: "not_announced",
          note: "",
        },
        {
          day: TODAY,
          name: "Apel pagi uji",
          status: "not_announced",
          note: "",
        },
        {
          day: YESTERDAY,
          name: "Belajar malam uji",
          status: "present",
          note: "",
        },
        {
          day: YESTERDAY,
          name: "Apel pagi uji",
          status: "absent",
          note: "Sakit",
        },
      ]);
    });
  });

  it("reads only the account's own student: another resident's absence counts for them, not for her", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await count(db, records, {
        activityId: records.morning,
        day: YESTERDAY,
        marks: { [records.budi]: { isAbsent: true, note: "Izin pulang" } },
      });

      const ani = await readOwnAttendance(db, residentOf(records.ani), NIGHT);
      const budi = await readOwnAttendance(db, residentOf(records.budi), NIGHT);

      expect(ani.kind === "shown" && ani.attendance.absent).toBe(0);
      expect(budi.kind === "shown" && budi.attendance.absent).toBe(1);
      const notes =
        ani.kind === "shown" ? ani.attendance.history.map((e) => e.note) : [];
      expect(notes).not.toContain("Izin pulang");
    });
  });

  it("keeps an announced count in Riwayat after its activity is removed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await count(db, records, {
        activityId: records.evening,
        day: TODAY,
        marks: { [records.ani]: { isAbsent: true, note: "" } },
      });
      const manager = await addTestActor(db, "Pengelola Uji Riwayat", [
        "dorm_manager",
      ]);
      await removeActivity(db, manager, records.evening, TODAY);

      const answer = await readOwnAttendance(
        db,
        residentOf(records.ani),
        NIGHT,
      );

      if (answer.kind !== "shown") throw new Error("It was refused.");
      expect(answer.attendance.absent).toBe(1);
      expect(answer.attendance.history[0]).toMatchObject({
        day: TODAY,
        name: "Belajar malam uji",
        status: "absent",
      });
    });
  });

  it("refuses an account without the right, one without a student, and a student who lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const staff = await readOwnAttendance(
        db,
        residentOf(records.ani, ["dorm_manager"]),
        NIGHT,
      );
      const noStudent = await readOwnAttendance(db, residentOf(null), NIGHT);
      const senior = await readOwnAttendance(
        db,
        residentOf(records.senior),
        NIGHT,
      );

      expect(staff).toEqual({ kind: "refused" });
      expect(noStudent).toEqual({ kind: "refused" });
      expect(senior).toEqual({ kind: "refused" });
    });
  });
});
