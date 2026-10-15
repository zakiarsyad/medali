// Sample NIMs of this file: 9986170000 to 9986170099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { characterAssessments } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveAssessmentFile } from "./save-assessment-file";
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
const own = withOwnTestDatabase("asesmenberkas");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");

describe("Simpan (n) baris pressed twice at the same moment", () => {
  it("keeps the rows once: the second waits, then answers the same", async () => {
    await addTestPeriod(own.db, 2026);
    const { studentIds } = await addTestStudents(
      own.db,
      "Prodi Uji Berkas Asesmen Sekaligus",
      2026,
      ["9986170001", "9986170002"],
    );
    const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
      "assessor",
    ]);
    const id = crypto.randomUUID();
    const file = {
      name: "asesmen.csv",
      bytes: new TextEncoder().encode(
        [
          "nim,mandiri,empati,disiplin,adaptif,loyal,integritas",
          "9986170001,80,78,84,72,82,86",
          "9986170002,80,78,84,72,82,86",
        ].join("\n"),
      ),
    };

    const both = await own.atOnce(
      (db) =>
        saveAssessmentFile(db, penilai, id, "mentor_observation", file, MOMENT),
      (db) =>
        saveAssessmentFile(db, penilai, id, "mentor_observation", file, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: { saved: 2 } });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(characterAssessments)
      .where(eq(characterAssessments.uploadId, id));
    expect(kept.map((row) => row.studentId).sort()).toEqual(
      [...studentIds].sort(),
    );
  });
});
