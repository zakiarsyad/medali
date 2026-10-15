// Sample NIMs of this file: 9986030000 to 9986030099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { characterAssessments } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveAssessment } from "./save-assessment";
import {
  addTestActor,
  addTestPeriod,
  addTestStudents,
} from "./test-assessments";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("assessment");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");

describe("Simpan asesmen pressed twice at the same moment", () => {
  it("keeps the assessment once: the second waits, then answers the same", async () => {
    await addTestPeriod(own.db, 2026);
    const { studentIds } = await addTestStudents(
      own.db,
      "Prodi Uji Asesmen Sekaligus",
      2026,
      ["9986030001"],
    );
    const [ani] = studentIds;
    if (!ani) throw new Error("Student missing.");
    const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
      "assessor",
    ]);
    const id = crypto.randomUUID();
    const sent = {
      studentId: ani,
      scores: { M: "80", E: "78", D: "84", A: "72", L: "82", I: "86" },
      source: "mentor_observation",
      note: "",
    };

    const both = await own.atOnce(
      (db) => saveAssessment(db, penilai, id, sent, MOMENT),
      (db) => saveAssessment(db, penilai, id, sent, MOMENT),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: "Mahasiswa Uji Asesmen 1",
    });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(characterAssessments)
      .where(eq(characterAssessments.studentId, ani));
    expect(kept).toHaveLength(1);
  });
});
