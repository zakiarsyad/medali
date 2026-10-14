// Sample NIMs of this file: 9964000400 to 9964000499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { sikuAdjustmentChanges, sikuAdjustments } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveSikuEntry } from "./save-entry";
import {
  addTestActor,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("siku");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");

let records: { penilai: TestActor; studentIds: string[] } | undefined;

/** The period, the students and Penilai Mahasiswa, once for the file. */
async function prepared() {
  if (records) return records;
  await addTestYear(own.db, 2026);
  const { studentIds } = await addTestStudents(
    own.db,
    "Prodi Uji SIKU Sekaligus",
    2026,
    ["9964000401", "9964000402"],
  );
  const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
    "assessor",
  ]);
  records = { penilai, studentIds };
  return records;
}

describe("Simpan pressed twice at the same moment", () => {
  it("keeps the entry once, with one log line: the second waits, then answers the same", async () => {
    const { penilai, studentIds } = await prepared();
    const id = crypto.randomUUID();
    const sent = {
      kind: "gain",
      reason: "peer_mentoring",
      points: "2",
      day: "2026-10-12",
      note: "",
      basis: "",
      studentIds,
    };

    const both = await own.atOnce(
      (db) => saveSikuEntry(db, penilai, id, sent, MOMENT),
      (db) => saveSikuEntry(db, penilai, id, sent, MOMENT),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { kind: "gain", points: 2, students: 2 },
    });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(sikuAdjustments)
      .where(eq(sikuAdjustments.id, id));
    const lines = await own.db
      .select()
      .from(sikuAdjustmentChanges)
      .where(eq(sikuAdjustmentChanges.adjustmentId, id));
    expect(kept).toHaveLength(1);
    expect(lines).toHaveLength(1);
  });
});
