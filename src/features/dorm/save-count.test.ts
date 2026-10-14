// Sample Tahun akademik of this file: 2710 to 2710.
// Sample NIMs of this file: 9937720000 to 9937720099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormAttendanceChanges,
  dormLeaves,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { CountInput } from "./count-input";
import {
  ANNOUNCED_ALREADY,
  COUNT_CHANGED,
  COUNT_NOT_ALLOWED,
  NOT_A_PARTICIPANT,
  NOT_HELD_THAT_DAY,
  NOT_STARTED,
  ON_LEAVE,
} from "./count-messages";
import { readStoredCount } from "./count-store";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import { addTestActor, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * A period far from those of any other file of checks. Angkatan 2710 is
 * in semester 1 in it, so its Reguler students live in the dorm.
 */
const ODD_2710 = {
  startYear: 2710,
  term: "odd",
  startsOn: "2710-08-01",
  endsOn: "2711-01-31",
} as const;
const DAY = "2710-10-12";
// 10:00 on campus on 12 October 2710.
const MOMENT = new Date("2710-10-12T03:00:00Z");
const FROM = { startsOn: "2710-08-01" };

interface Records {
  counter: TestActor;
  /** A Reguler woman of semester 1: she lives in Dana Rakca. */
  ani: string;
  /** Another one, in Dana Rakca too. */
  cici: string;
  /** A Reguler woman of semester 3: she lives in no dorm. */
  senior: string;
  /** A daily activity for every resident, 05:30 to 06:15. */
  activityId: string;
}

async function addRecords(db: Database, roles: RoleId[] = ["bam_bphk"]) {
  await db.insert(academicPeriods).values(ODD_2710);
  const program = await addTestProgram(db, "Prodi Uji Hitung Kehadiran");
  const student = (nim: string, name: string, cohortYear = 2710) =>
    addTestStudent(db, program, { nim, name, cohortYear });
  const counter = await addTestActor(db, "BAM Uji Hitung", roles);
  const records: Records = {
    counter,
    ani: await student("9937720001", "Ani Penghuni Uji"),
    cici: await student("9937720002", "Cici Penghuni Uji"),
    senior: await student("9937720003", "Senior Uji", 2709),
    activityId: await addTestActivity(db, counter.id, { versions: [FROM] }),
  };
  return records;
}

function countOf(records: Records, more: Partial<CountInput> = {}): CountInput {
  return {
    activityId: records.activityId,
    day: DAY,
    version: 0,
    isAnnouncement: false,
    marks: { [records.ani]: { isAbsent: true, note: "Sakit" } },
    ...more,
  };
}

function logOf(db: Database, countId: string) {
  return db
    .select()
    .from(dormAttendanceChanges)
    .where(eq(dormAttendanceChanges.countId, countId))
    .orderBy(dormAttendanceChanges.changedAt);
}

describe("saveCount", () => {
  it("keeps a draft of every participant, the one ticked as absent with her note and the other as Hadir, without a log line", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveCount(
        db,
        records.counter,
        countOf(records),
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { version: 1, isAnnounced: false },
      });
      const kept = await readStoredCount(db, records.activityId, DAY);
      expect(kept).toMatchObject({ version: 1, announcedAt: null });
      expect(kept?.marks).toEqual({
        [records.ani]: { isAbsent: true, note: "Sakit" },
        [records.cici]: { isAbsent: false, note: "" },
      });
      expect(await logOf(db, kept?.id ?? "")).toEqual([]);
    });
  });

  it("refuses to mark absent a participant whose approved leave covers the activity, and keeps her note", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await db.insert(dormLeaves).values({
        id: crypto.randomUUID(),
        studentId: records.ani,
        kind: "outing",
        startsAt: new Date(`${DAY}T05:00:00+07:00`),
        endsAt: new Date(`${DAY}T07:00:00+07:00`),
        purpose: "Kontrol ke dokter",
        destination: "Klinik",
        contact: "",
        status: "approved",
        sentAt: MOMENT,
        decidedBy: records.counter.id,
        decidedAt: MOMENT,
      });

      const absent = await saveCount(
        db,
        records.counter,
        countOf(records),
        MOMENT,
      );
      const noted = await saveCount(
        db,
        records.counter,
        countOf(records, {
          marks: { [records.ani]: { isAbsent: false, note: "Izin dokter" } },
        }),
        MOMENT,
      );

      expect(absent).toEqual(ON_LEAVE);
      expect(noted.ok).toBe(true);
      const kept = await readStoredCount(db, records.activityId, DAY);
      expect(kept?.marks[records.ani]).toEqual({
        isAbsent: false,
        note: "Izin dokter",
      });
    });
  });

  it("announces with who and when, and logs what was announced with nothing before", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await saveCount(db, records.counter, countOf(records), MOMENT);

      const saved = await saveCount(
        db,
        records.counter,
        countOf(records, { version: 1, isAnnouncement: true }),
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { version: 2, isAnnounced: true },
      });
      const kept = await readStoredCount(db, records.activityId, DAY);
      expect(kept?.announcedBy).toBe("BAM Uji Hitung");
      expect(kept?.announcedAt).toBeInstanceOf(Date);
      const log = await logOf(db, kept?.id ?? "");
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        changedBy: records.counter.id,
        marksBefore: null,
        marksAfter: { [records.ani]: { isAbsent: true, note: "Sakit" } },
      });
    });
  });

  it("takes a correction after an announcement only as Umumkan ulang, and logs it with what was announced before", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const first = countOf(records, { isAnnouncement: true });
      await saveCount(db, records.counter, first, MOMENT);
      const corrected = {
        [records.cici]: { isAbsent: true, note: "" },
      };

      const draft = await saveCount(
        db,
        records.counter,
        countOf(records, { version: 1, marks: corrected }),
        MOMENT,
      );
      const again = await saveCount(
        db,
        records.counter,
        countOf(records, {
          version: 1,
          isAnnouncement: true,
          marks: corrected,
        }),
        MOMENT,
      );

      expect(draft).toEqual(ANNOUNCED_ALREADY);
      expect(again).toEqual({
        ok: true,
        value: { version: 2, isAnnounced: true },
      });
      const kept = await readStoredCount(db, records.activityId, DAY);
      expect(kept?.marks[records.ani]).toEqual({ isAbsent: false, note: "" });
      const log = await logOf(db, kept?.id ?? "");
      expect(log).toHaveLength(2);
      expect(log[1]).toMatchObject({
        marksBefore: { [records.ani]: { isAbsent: true, note: "Sakit" } },
        marksAfter: corrected,
      });
    });
  });

  it("refuses a save made from a count that was saved since, and keeps the one saved", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await saveCount(db, records.counter, countOf(records), MOMENT);

      const stale = await saveCount(
        db,
        records.counter,
        countOf(records, { marks: {} }),
        MOMENT,
      );

      expect(stale).toEqual(COUNT_CHANGED);
      const kept = await readStoredCount(db, records.activityId, DAY);
      expect(kept?.version).toBe(1);
      expect(kept?.marks[records.ani]?.isAbsent).toBe(true);
    });
  });

  it.each<[string, string]>([
    ["Pengelola Asrama", "dorm_manager"],
    ["Kepala Unit", "head_of_unit"],
    ["a student", "student"],
  ])("refuses a hand-made count from %s and keeps nothing", async (_, role) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const sender = await addTestActor(db, "Bukan BAM Uji", [role as RoleId]);

      const saved = await saveCount(db, sender, countOf(records), MOMENT);

      expect(saved).toEqual(COUNT_NOT_ALLOWED);
      expect(await readStoredCount(db, records.activityId, DAY)).toBeNull();
    });
  });

  it("refuses to count an activity before it starts, today or on a later day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const evening = await addTestActivity(db, records.counter.id, {
        versions: [{ ...FROM, startTime: "19:00", endTime: "21:00" }],
      });

      const tonight = await saveCount(
        db,
        records.counter,
        countOf(records, { activityId: evening }),
        MOMENT,
      );
      const tomorrow = await saveCount(
        db,
        records.counter,
        countOf(records, { day: "2710-10-13" }),
        MOMENT,
      );

      expect(tonight).toEqual(NOT_STARTED);
      expect(tomorrow).toEqual(NOT_STARTED);
    });
  });

  it("refuses an activity that does not take place on the day, and one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      // 12 October 2710 is a Wednesday; this one is on Mondays.
      const weekly = await addTestActivity(db, records.counter.id, {
        versions: [{ ...FROM, pattern: "weekly", weekdays: [1] }],
      });

      const notThatDay = await saveCount(
        db,
        records.counter,
        countOf(records, { activityId: weekly }),
        MOMENT,
      );
      const missing = await saveCount(
        db,
        records.counter,
        countOf(records, {
          activityId: "00000000-0000-4000-8000-0000000000ff",
        }),
        MOMENT,
      );

      expect(notThatDay).toEqual(NOT_HELD_THAT_DAY);
      expect(missing).toEqual(NOT_HELD_THAT_DAY);
    });
  });

  it("refuses to mark someone who does not take part: a student who lives in no dorm, or a woman at an activity for the men", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const forMen = await addTestActivity(db, records.counter.id, {
        versions: [{ ...FROM, audience: "men" }],
      });

      const senior = await saveCount(
        db,
        records.counter,
        countOf(records, {
          marks: { [records.senior]: { isAbsent: true, note: "" } },
        }),
        MOMENT,
      );
      const woman = await saveCount(
        db,
        records.counter,
        countOf(records, { activityId: forMen }),
        MOMENT,
      );

      expect(senior).toEqual(NOT_A_PARTICIPANT);
      expect(woman).toEqual(NOT_A_PARTICIPANT);
      expect(await readStoredCount(db, records.activityId, DAY)).toBeNull();
    });
  });

  it("keeps one count for each day of a repeating activity", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await saveCount(db, records.counter, countOf(records), MOMENT);
      const dayBefore = await saveCount(
        db,
        records.counter,
        countOf(records, { day: "2710-10-11" }),
        MOMENT,
      );

      expect(dayBefore.ok).toBe(true);
      expect(await readStoredCount(db, records.activityId, DAY)).not.toBeNull();
      expect(
        await readStoredCount(db, records.activityId, "2710-10-11"),
      ).not.toBeNull();
    });
  });
});
