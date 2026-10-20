// Sample NIMs of this file: 9986300800 to 9986300899.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { healthNotes } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { SentNote } from "@/health-notes/health-input";
import { readDormHealthSubject } from "./dorm-health-subject";
import { saveDormHealthNote } from "./save-dorm-health-note";
import { addHealthActor } from "./test-health";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end; notes are never erased, so each check adds its own resident.
 */
const own = withOwnTestDatabase("sehatasrama");

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

/** A Pembibitan student, who lives in the dorm with no period running. */
async function addResident(program: string, nim: string): Promise<string> {
  const programId = await addTestProgram(own.db, program);
  return addTestStudent(own.db, programId, {
    nim,
    name: `Penghuni Uji ${nim}`,
    isSeedling: true,
  });
}

function noteFor(studentId: string, advice: string): SentNote {
  return {
    studentId,
    examinedOn: "2026-10-16",
    examiner: "",
    illnesses: [],
    illnessNotes: [],
    otherHistory: "",
    medicine: "",
    advice,
    category: "",
  };
}

describe("Simpan catatan pressed by two writers for one resident at the same moment", () => {
  it("keeps both in order: the second waits, and its note counts", async () => {
    const studentId = await addResident(
      "Prodi Uji Sehat Asrama Berdua",
      "9986300801",
    );
    const bam = await addHealthActor(own.db, "BAM Kesehatan Ani", [
      "bam_health",
    ]);
    const kepala = await addHealthActor(own.db, "Kepala Budi", [
      "head_of_unit",
    ]);

    const both = await own.atOnce(
      (db) =>
        saveDormHealthNote(
          db,
          bam,
          crypto.randomUUID(),
          noteFor(studentId, "Catatan BAM."),
          STARTING_LIMITS,
          MOMENT,
        ),
      (db) =>
        saveDormHealthNote(
          db,
          kepala,
          crypto.randomUUID(),
          noteFor(studentId, "Catatan Kepala."),
          STARTING_LIMITS,
          MOMENT,
        ),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toMatchObject({ ok: true });
    const subject = await readDormHealthSubject(
      own.db,
      bam,
      studentId,
      STARTING_LIMITS,
      "2026-10-16",
    );
    expect(subject?.notes.map((note) => note.advice)).toEqual([
      "Catatan Kepala.",
      "Catatan BAM.",
    ]);
  });
});

describe("Simpan catatan pressed twice at the same moment", () => {
  it("keeps the note once: the second waits, then answers the same", async () => {
    const studentId = await addResident(
      "Prodi Uji Sehat Asrama Dua Kali",
      "9986300811",
    );
    const bam = await addHealthActor(own.db, "BAM Kesehatan Sekaligus", [
      "bam_health",
    ]);
    const id = crypto.randomUUID();
    const sent = noteFor(studentId, "Satu catatan.");

    const both = await own.atOnce(
      (db) => saveDormHealthNote(db, bam, id, sent, STARTING_LIMITS, MOMENT),
      (db) => saveDormHealthNote(db, bam, id, sent, STARTING_LIMITS, MOMENT),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(healthNotes)
      .where(eq(healthNotes.studentId, studentId));
    expect(kept).toHaveLength(1);
  });
});
