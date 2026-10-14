// Sample Tahun akademik of this file: 3060 to 3060.
// Sample NIMs of this file: 9937980700 to 9937980799.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { WITHDRAWN_NOTE } from "./clarification-words";
import type { CountMarks } from "./count-ids";
import { readStoredCount } from "./count-store";
import { saveCount } from "./save-count";
import { addTestActivity } from "./test-activities";
import {
  addTestClarification,
  changesOf,
  clarificationById,
} from "./test-clarifications";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const DAY = "3060-10-13";
/** 23:00 on campus on that day: the Apel pagi is over. */
const NIGHT = new Date("3060-10-13T16:00:00Z");

async function addRecords(db: Database) {
  const [ani, budi, citra] = await addTestResidents(
    db,
    3060,
    "Prodi Uji Tarik Klar",
    ["9937980701", "9937980702", "9937980703"],
  );
  if (!ani || !budi || !citra) throw new Error("The residents were not added.");
  const bam = await addTestActor(db, "BAM Uji Tarik Klar", ["bam_bphk"]);
  const activityId = await addTestActivity(db, bam.id, {
    versions: [{ startsOn: "3060-10-01" }],
  });
  return { ani, budi, citra, bam, activityId };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

async function announce(
  db: Database,
  records: Records,
  marks: CountMarks,
  version: number,
) {
  const saved = await saveCount(
    db,
    records.bam,
    {
      activityId: records.activityId,
      day: DAY,
      marks,
      version,
      isAnnouncement: true,
    },
    NIGHT,
  );
  if (!saved.ok) throw new Error(saved.error);
}

const ABSENT = { isAbsent: true, note: "" };

describe("Umumkan ulang without an absence", () => {
  it("closes the waiting clarifications of the residents it no longer marks absent, with the note that the absence was withdrawn, and keeps the others", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, budi, citra, bam } = records;
      await announce(
        db,
        records,
        {
          [ani.studentId]: ABSENT,
          [budi.studentId]: ABSENT,
          [citra.studentId]: ABSENT,
        },
        0,
      );
      const count = await readStoredCount(db, records.activityId, DAY);
      if (!count) throw new Error("The count was not kept.");
      const waiting = await addTestClarification(db, bam.id, {
        countId: count.id,
        studentId: ani.studentId,
      });
      const passedOn = await addTestClarification(db, bam.id, {
        countId: count.id,
        studentId: budi.studentId,
        status: "verified",
      });
      const stillAbsent = await addTestClarification(db, bam.id, {
        countId: count.id,
        studentId: citra.studentId,
      });

      await announce(db, records, { [citra.studentId]: ABSENT }, 1);

      for (const [id, before] of [
        [waiting, "submitted"],
        [passedOn, "verified"],
      ] as const) {
        expect(await clarificationById(db, id)).toMatchObject({
          status: "closed",
          decidedBy: bam.id,
          decisionNote: WITHDRAWN_NOTE,
        });
        expect((await changesOf(db, id)).at(-1)).toMatchObject({
          changedBy: bam.id,
          statusBefore: before,
          statusAfter: "closed",
          note: WITHDRAWN_NOTE,
        });
      }
      expect(await clarificationById(db, stillAbsent)).toMatchObject({
        status: "submitted",
      });
    });
  });

  it("leaves a decided clarification as it is", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, bam } = records;
      await announce(db, records, { [ani.studentId]: ABSENT }, 0);
      const count = await readStoredCount(db, records.activityId, DAY);
      if (!count) throw new Error("The count was not kept.");
      const accepted = await addTestClarification(db, bam.id, {
        countId: count.id,
        studentId: ani.studentId,
        status: "accepted",
      });

      await announce(db, records, {}, 1);

      expect(await clarificationById(db, accepted)).toMatchObject({
        status: "accepted",
      });
    });
  });
});
