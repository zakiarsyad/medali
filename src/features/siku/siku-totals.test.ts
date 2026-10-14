// Sample Tahun akademik of this file: 2901 to 2901.
// Sample NIMs of this file: 9964000100 to 9964000199.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readTotalsOf } from "./siku-totals";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2901);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Jumlah SIKU",
    2901,
    ["9964000101", "9964000102"],
  );
  const [ani, budi] = studentIds;
  if (!ani || !budi) throw new Error("The students were not added.");
  const penilai = await addTestActor(db, "Penilai Uji Jumlah", ["assessor"]);
  return { periods, ani, budi, penilai };
}

describe("readTotalsOf", () => {
  it("runs on from one semester to the next, without starting again", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, penilai } = await addRecords(db);
      await addTestEntry(db, penilai, {
        kind: "gain",
        reason: "peer_mentoring",
        points: 4,
        day: "2901-10-12",
        periodId: periods.odd,
        studentIds: [ani],
      });
      await addTestEntry(db, penilai, {
        kind: "loss",
        reason: "unannounced_absence",
        points: 3,
        day: "2902-03-02",
        periodId: periods.even,
        studentIds: [ani],
      });
      await addTestEntry(db, penilai, {
        kind: "gain",
        reason: "knowledge_sharing",
        points: 2,
        day: "2902-03-09",
        periodId: periods.even,
        studentIds: [ani],
      });

      const totals = await readTotalsOf(db, [ani]);

      expect(totals.get(ani)).toEqual({ gains: 6, losses: 3 });
    });
  });

  it("leaves out a cancelled entry", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, budi, penilai } = await addRecords(db);
      await addTestEntry(db, penilai, {
        kind: "loss",
        reason: "discipline_penalty",
        points: 5,
        day: "2901-10-12",
        periodId: periods.odd,
        studentIds: [ani, budi],
        cancelled: true,
      });
      await addTestEntry(db, penilai, {
        kind: "loss",
        reason: "student_violation",
        points: 2,
        day: "2901-10-13",
        periodId: periods.odd,
        studentIds: [budi],
      });

      const totals = await readTotalsOf(db, [ani, budi]);

      expect(totals.get(ani)).toEqual({ gains: 0, losses: 0 });
      expect(totals.get(budi)).toEqual({ gains: 0, losses: 2 });
    });
  });

  it("gives nothing for no student", async () => {
    await inTestDatabase(async (db) => {
      expect((await readTotalsOf(db, [])).size).toBe(0);
    });
  });
});
