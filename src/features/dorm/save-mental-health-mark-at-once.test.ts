// Sample NIMs of this file: 9986400200 to 9986400299.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mentalHealthMarkChanges, mentalHealthMarks } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { SentNote } from "@/health-notes/health-input";
import { saveDormHealthNote } from "./save-dorm-health-note";
import { addHealthActor } from "./test-health";

/*
 * Two saves at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end; marks are never deleted, so each check adds its own resident.
 */
const own = withOwnTestDatabase("penandaasrama");

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

/** A Pembibitan student, who lives in the dorm with no period running. */
async function addResident(nim: string): Promise<string> {
  const programId = await addTestProgram(own.db, `Prodi Uji Penanda ${nim}`);
  return addTestStudent(own.db, programId, {
    nim,
    name: `Penghuni Uji ${nim}`,
    isSeedling: true,
  });
}

function emptyNote(studentId: string): SentNote {
  return {
    studentId,
    examinedOn: "2026-10-16",
    examiner: "",
    illnesses: [],
    illnessNotes: [],
    otherHistory: "",
    medicine: "",
    advice: "",
    category: "",
  };
}

describe("a mark saved by two writers for one resident at the same moment", () => {
  it("keeps one current mark, the later one, and logs both changes in order", async () => {
    const studentId = await addResident("9986400201");
    const bam = await addHealthActor(own.db, "BAM Penanda Berdua", [
      "bam_health",
    ]);
    const kepala = await addHealthActor(own.db, "Kepala Penanda Berdua", [
      "head_of_unit",
    ]);
    const filled = { filledCategory: "", filledObservation: "" };
    const watch = {
      category: "monitor",
      observation: "Sulit tidur.",
      ...filled,
    };
    const refer = {
      category: "refer",
      observation: "Menarik diri.",
      ...filled,
    };

    const both = await own.atOnce(
      (db) =>
        saveDormHealthNote(
          db,
          bam,
          crypto.randomUUID(),
          emptyNote(studentId),
          STARTING_LIMITS,
          MOMENT,
          watch,
        ),
      (db) =>
        saveDormHealthNote(
          db,
          kepala,
          crypto.randomUUID(),
          emptyNote(studentId),
          STARTING_LIMITS,
          MOMENT,
          refer,
        ),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toMatchObject({ ok: true });
    const marks = await own.db
      .select({ category: mentalHealthMarks.category })
      .from(mentalHealthMarks)
      .where(eq(mentalHealthMarks.studentId, studentId));
    expect(marks).toEqual([{ category: "refer" }]);
    const lines = await own.db
      .select({
        before: mentalHealthMarkChanges.categoryBefore,
        after: mentalHealthMarkChanges.categoryAfter,
      })
      .from(mentalHealthMarkChanges)
      .where(eq(mentalHealthMarkChanges.studentId, studentId))
      .orderBy(asc(mentalHealthMarkChanges.changedAt));
    expect(lines).toEqual([
      { before: null, after: "monitor" },
      { before: "monitor", after: "refer" },
    ]);
  });
});
