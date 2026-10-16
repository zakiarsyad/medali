// Sample NIMs of this file: 9986300300 to 9986300399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { healthNotes } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { STARTING_LIMITS } from "./fitness-ids";
import type { SentNote } from "./health-input";
import { readHealthSubject } from "./health-subject";
import { saveHealthNote } from "./save-health-note";
import { addTestActor, addTestStudents } from "./test-fitness";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end; notes are never erased, so each check adds its own students.
 */
const own = withOwnTestDatabase("kesehatan");

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

async function addStudent(program: string, nim: string): Promise<string> {
  const { studentIds } = await addTestStudents(own.db, program, [nim]);
  const [studentId = ""] = studentIds;
  return studentId;
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

describe("Simpan catatan pressed by two people for one student at the same moment", () => {
  it("keeps both in order: the second waits, and its note counts", async () => {
    const studentId = await addStudent(
      "Prodi Uji Kesehatan Berdua",
      "9986300301",
    );
    const ani = await addTestActor(own.db, "Penilai Ani", ["assessor"]);
    const budi = await addTestActor(own.db, "Kepala Budi", ["head_of_unit"]);

    const both = await own.atOnce(
      (db) =>
        saveHealthNote(
          db,
          ani,
          crypto.randomUUID(),
          noteFor(studentId, "Catatan Ani."),
          STARTING_LIMITS,
          MOMENT,
        ),
      (db) =>
        saveHealthNote(
          db,
          budi,
          crypto.randomUUID(),
          noteFor(studentId, "Catatan Budi."),
          STARTING_LIMITS,
          MOMENT,
        ),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toMatchObject({ ok: true });
    const subject = await readHealthSubject(
      own.db,
      ani,
      studentId,
      STARTING_LIMITS,
      "2026-10-16",
    );
    expect(subject?.notes.map((note) => note.advice)).toEqual([
      "Catatan Budi.",
      "Catatan Ani.",
    ]);
  });
});

describe("Simpan catatan pressed twice at the same moment", () => {
  it("keeps the note once: the second waits, then answers the same", async () => {
    const studentId = await addStudent(
      "Prodi Uji Kesehatan Dua Kali",
      "9986300311",
    );
    const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
      "assessor",
    ]);
    const id = crypto.randomUUID();
    const sent = noteFor(studentId, "Satu catatan.");

    const both = await own.atOnce(
      (db) => saveHealthNote(db, penilai, id, sent, STARTING_LIMITS, MOMENT),
      (db) => saveHealthNote(db, penilai, id, sent, STARTING_LIMITS, MOMENT),
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
