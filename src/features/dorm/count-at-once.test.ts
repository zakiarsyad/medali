// Sample NIMs of this file: 9937730000 to 9937730099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormAttendanceChanges,
  dormAttendanceCounts,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { CountInput } from "./count-input";
import { COUNT_CHANGED } from "./count-messages";
import { readStoredCount } from "./count-store";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import { addTestActor, type TestActor } from "./test-records";

/*
 * Two saves at the same moment need two connections that both see the
 * saved count, and the log of announcements cannot be emptied. So these
 * checks have a database of their own, dropped at the end, and each uses
 * an activity of its own.
 */
const own = withOwnTestDatabase("hitungasrama");

const DAY = "2026-10-12";
// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");

interface Records {
  first: TestActor;
  second: TestActor;
  residentId: string;
  activityId: string;
}

let residentId: string | undefined;

/** A resident, once for the file: angkatan 2026 lives in the dorm then. */
async function resident(): Promise<string> {
  if (residentId) return residentId;
  await own.db.insert(academicPeriods).values({
    startYear: 2026,
    term: "odd",
    startsOn: "2026-08-01",
    endsOn: "2027-01-31",
  });
  const program = await addTestProgram(own.db, "Prodi Uji Hitung Sekaligus");
  residentId = await addTestStudent(own.db, program, {
    nim: "9937730001",
    name: "Penghuni Uji Sekaligus",
  });
  return residentId;
}

/** Two BAM members and an activity of their own. `place` tells them apart. */
async function addRecords(place: number): Promise<Records> {
  const first = await addTestActor(own.db, `BAM Pertama ${place}`, [
    "bam_bphk",
  ]);
  const second = await addTestActor(own.db, `BAM Kedua ${place}`, [
    "bam_compliance",
  ]);
  const activityId = await addTestActivity(own.db, first.id);
  return { first, second, residentId: await resident(), activityId };
}

function countOf(records: Records, more: Partial<CountInput> = {}) {
  return {
    activityId: records.activityId,
    day: DAY,
    version: 0,
    isAnnouncement: true,
    marks: { [records.residentId]: { isAbsent: true, note: "" } },
    ...more,
  };
}

function countsOf(db: Database, activityId: string) {
  return db
    .select()
    .from(dormAttendanceCounts)
    .where(eq(dormAttendanceCounts.activityId, activityId));
}

function logOf(db: Database, countId: string) {
  return db
    .select()
    .from(dormAttendanceChanges)
    .where(eq(dormAttendanceChanges.countId, countId));
}

describe("two BAM members saving one count at the same moment", () => {
  it("keeps one count of a new one: the second waits, then is told it was changed by someone else", async () => {
    const records = await addRecords(1);

    const both = await own.atOnce(
      (db) => saveCount(db, records.first, countOf(records), MOMENT),
      (db) =>
        saveCount(db, records.second, countOf(records, { marks: {} }), MOMENT),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { version: 1, isAnnounced: true, ownMarkRefusal: null },
    });
    expect(both.later).toEqual(COUNT_CHANGED);
    const counts = await countsOf(own.db, records.activityId);
    expect(counts).toHaveLength(1);
    expect(await logOf(own.db, counts[0]?.id ?? "")).toHaveLength(1);
  });

  it("keeps the correction of the first of two who correct one announced count, and refuses the second", async () => {
    const records = await addRecords(2);
    await saveCount(own.db, records.first, countOf(records), MOMENT);
    const present = { [records.residentId]: { isAbsent: false, note: "" } };
    const noted = {
      [records.residentId]: { isAbsent: true, note: "Sakit" },
    };

    const both = await own.atOnce(
      (db) =>
        saveCount(
          db,
          records.first,
          countOf(records, { version: 1, marks: present }),
          MOMENT,
        ),
      (db) =>
        saveCount(
          db,
          records.second,
          countOf(records, { version: 1, marks: noted }),
          MOMENT,
        ),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { version: 2, isAnnounced: true, ownMarkRefusal: null },
    });
    expect(both.later).toEqual(COUNT_CHANGED);
    const kept = await readStoredCount(own.db, records.activityId, DAY);
    expect(kept?.marks).toEqual(present);
    expect(await logOf(own.db, kept?.id ?? "")).toHaveLength(2);
  });
});
