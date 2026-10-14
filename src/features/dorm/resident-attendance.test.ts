// Sample Tahun akademik of this file: 2740 to 2740.
// Sample NIMs of this file: 9937790000 to 9937790099.

import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, dormAttendanceCounts, dormLeaves } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { CountInput } from "./count-input";
import { removeActivity } from "./remove-activity";
import { readOwnAttendance } from "./resident-attendance";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import { addTestClarification } from "./test-clarifications";
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

describe("readOwnAttendance with approved leave", () => {
  it("shows an activity in the time of Izin pesiar as Izin, out of the percentage, and one in ITMK as Hadir with ITMK", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, morning, evening } = records;
      await count(db, records, {
        activityId: morning,
        day: YESTERDAY,
        marks: { [ani]: { isAbsent: true, note: "" } },
      });
      await count(db, records, {
        activityId: evening,
        day: YESTERDAY,
        marks: { [ani]: { isAbsent: true, note: "" } },
      });
      // Approved after the counts were announced.
      const approved = {
        studentId: ani,
        purpose: "Kontrol ke dokter",
        destination: "",
        contact: "",
        status: "approved" as const,
        sentAt: NIGHT,
        decidedBy: records.counter.id,
        decidedAt: NIGHT,
      };
      await db.insert(dormLeaves).values([
        {
          ...approved,
          id: crypto.randomUUID(),
          kind: "outing",
          startsAt: new Date(`${YESTERDAY}T05:00:00+07:00`),
          endsAt: new Date(`${YESTERDAY}T08:00:00+07:00`),
        },
        {
          ...approved,
          id: crypto.randomUUID(),
          kind: "skip_activities",
          startsAt: new Date(`${YESTERDAY}T19:00:00+07:00`),
          endsAt: new Date(`${YESTERDAY}T21:30:00+07:00`),
        },
      ]);

      const answer = await readOwnAttendance(db, residentOf(ani), NIGHT);

      if (answer.kind !== "shown") throw new Error("It was refused.");
      expect(answer.attendance.present).toBe(1);
      expect(answer.attendance.absent).toBe(0);
      const yesterday = answer.attendance.history.filter(
        (entry) => entry.day === YESTERDAY,
      );
      expect(
        yesterday.map(({ name, status, note }) => [name, status, note]),
      ).toEqual([
        ["Belajar malam uji", "present", "ITMK"],
        ["Apel pagi uji", "leave", ""],
      ]);
    });
  });
});

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

  it("counts an activity announced while it runs only once it is over", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      // 05:45 and 05:50 on campus: Apel pagi runs from 05:30 to 06:15.
      const announcing = new Date("2740-10-13T22:45:00Z");
      const running = new Date("2740-10-13T22:50:00Z");
      const after = new Date("2740-10-13T23:30:00Z");
      const saved = await saveCount(
        db,
        records.counter,
        {
          activityId: records.morning,
          day: TODAY,
          version: 0,
          isAnnouncement: true,
          marks: { [records.ani]: { isAbsent: true, note: "" } },
        },
        announcing,
      );
      expect(saved.ok).toBe(true);
      const ani = residentOf(records.ani);

      const during = await readOwnAttendance(db, ani, running);
      const over = await readOwnAttendance(db, ani, after);

      if (during.kind !== "shown" || over.kind !== "shown") {
        throw new Error("It was refused.");
      }
      expect(during.attendance.absent).toBe(0);
      expect(during.attendance.history.map((entry) => entry.day)).not.toContain(
        TODAY,
      );
      expect(over.attendance.absent).toBe(1);
      expect(over.attendance.history[0]).toMatchObject({
        day: TODAY,
        status: "absent",
      });
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

describe("readOwnAttendance with clarifications", () => {
  it("shows in Riwayat the newest clarification of an absence with its note and Ajukan ulang, and counts those that wait as Klarifikasi aktif", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, morning, evening, counter } = records;
      await count(db, records, {
        activityId: morning,
        day: YESTERDAY,
        marks: { [ani]: { isAbsent: true, note: "" } },
      });
      await count(db, records, {
        activityId: evening,
        day: YESTERDAY,
        marks: { [ani]: { isAbsent: true, note: "" } },
      });
      const morningCount = await countIdOf(db, morning, YESTERDAY);
      const eveningCount = await countIdOf(db, evening, YESTERDAY);
      await addTestClarification(db, counter.id, {
        countId: morningCount,
        studentId: ani,
        status: "rejected",
        verifyNote: "Tidak ada surat.",
        sentAt: new Date("2740-10-13T14:00:00Z"),
      });
      await addTestClarification(db, counter.id, {
        countId: eveningCount,
        studentId: ani,
        status: "verified",
        fileKey: "dorm-clarifications/uji",
      });

      const answer = await readOwnAttendance(db, residentOf(ani), NIGHT);

      if (answer.kind !== "shown") throw new Error("It was refused.");
      const cells = answer.attendance.history
        .filter((entry) => entry.day === YESTERDAY)
        .map((entry) => [entry.name, entry.clarification]);
      expect(cells).toEqual([
        [
          "Belajar malam uji",
          {
            badge: "verified",
            note: "",
            file: {
              clarificationId: expect.any(String),
              name: "surat-keterangan.pdf",
            },
            action: null,
          },
        ],
        [
          "Apel pagi uji",
          {
            badge: "rejected",
            note: "Tidak ada surat.",
            file: null,
            action: "ask_again",
          },
        ],
      ]);
      expect(answer.attendance.waitingClarifications).toBe(1);
    });
  });
});

async function countIdOf(db: Database, activityId: string, day: string) {
  const [found] = await db
    .select({ id: dormAttendanceCounts.id })
    .from(dormAttendanceCounts)
    .where(
      and(
        eq(dormAttendanceCounts.activityId, activityId),
        eq(dormAttendanceCounts.day, day),
      ),
    );
  if (!found) throw new Error("The count is missing.");
  return found.id;
}
