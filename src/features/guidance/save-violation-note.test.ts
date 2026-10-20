// Sample Tahun akademik of this file: 4411 to 4411.
// Sample NIMs of this file: 9944120000 to 9944120099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students, violationNotes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { DAY_IN_FUTURE, DAY_IN_NO_PERIOD, type SentNote } from "./note-input";
import {
  NOT_ALLOWED_TO_WRITE,
  NOT_WRITABLE,
  NOTE_ALREADY_SENT,
} from "./note-messages";
import { saveViolationNote } from "./save-violation-note";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
  addTestNote,
  linesOf,
  noteAt,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 4411, in Ganjil 4411/4412.
const MOMENT = new Date("4411-10-20T03:00:00Z");

async function setting(db: Database) {
  await addNotePeriods(db, 4411);
  const { studentIds } = await addNoteStudents(
    db,
    "Prodi Uji Simpan Catatan",
    "Mahasiswa Uji Simpan Catatan",
    ["9944120001", "9944120002", "9944120003"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Simpan", [
    "discipline_officer",
  ]);
  return { officer, studentIds };
}

function sent(studentId: string, more: Partial<SentNote> = {}): SentNote {
  return {
    studentId,
    day: "4411-10-20",
    description: "Terlambat mengikuti apel pagi",
    punishment: "warning",
    otherPunishment: "",
    remark: "",
    ...more,
  };
}

describe("saveViolationNote", () => {
  it("keeps the note as the work of the writer, with a line in the log, as Pelanggaran pertama for a student with no other note that semester", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const id = crypto.randomUUID();

      const saved = await saveViolationNote(
        db,
        officer,
        id,
        sent(one, { remark: "Sudah diingatkan." }),
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { name: "Mahasiswa Uji Simpan Catatan 1", category: "first" },
      });
      const kept = await noteAt(db, id);
      expect(kept).toEqual(
        expect.objectContaining({
          studentId: one,
          day: "4411-10-20",
          remark: "Sudah diingatkan.",
          savedBy: officer.id,
          removedAt: null,
        }),
      );
      const lines = await linesOf(db, id);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["added", officer.id],
      ]);
    });
  });

  it("makes a note Pelanggaran lanjutan when the student has another in the semester of its Tanggal, and not for one of a past semester", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = "", two = ""] = studentIds;
      await addTestNote(db, one, officer.id, "4411-09-01");
      await addTestNote(db, two, officer.id, "4411-07-01");

      const again = await saveViolationNote(
        db,
        officer,
        crypto.randomUUID(),
        sent(one),
        MOMENT,
      );
      const fresh = await saveViolationNote(
        db,
        officer,
        crypto.randomUUID(),
        sent(two),
        MOMENT,
      );

      expect(again.ok && again.value.category).toBe("further");
      expect(fresh.ok && fresh.value.category).toBe("first");
    });
  });

  it("refuses a Tanggal in the future and one in no academic period, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const future = crypto.randomUUID();
      const early = crypto.randomUUID();

      expect(
        await saveViolationNote(
          db,
          officer,
          future,
          sent(one, { day: "4411-10-21" }),
          MOMENT,
        ),
      ).toEqual({ ok: false, error: DAY_IN_FUTURE });
      expect(
        await saveViolationNote(
          db,
          officer,
          early,
          sent(one, { day: "4411-07-31" }),
          MOMENT,
        ),
      ).toEqual({ ok: false, error: DAY_IN_NO_PERIOD });
      expect(await noteAt(db, future)).toBeUndefined();
      expect(await noteAt(db, early)).toBeUndefined();
    });
  });

  it("answers a second press of the same form as the first, keeping one note and one log line", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const id = crypto.randomUUID();

      const first = await saveViolationNote(db, officer, id, sent(one), MOMENT);
      const second = await saveViolationNote(
        db,
        officer,
        id,
        sent(one),
        MOMENT,
      );

      expect(second).toEqual(first);
      const kept = await db
        .select()
        .from(violationNotes)
        .where(eq(violationNotes.studentId, one));
      expect(kept).toHaveLength(1);
      expect(await linesOf(db, id)).toHaveLength(1);
    });
  });

  it("refuses a form sent again with other content under the same key", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      const id = crypto.randomUUID();
      await saveViolationNote(db, officer, id, sent(one), MOMENT);

      expect(
        await saveViolationNote(
          db,
          officer,
          id,
          sent(one, { description: "Uraian yang lain" }),
          MOMENT,
        ),
      ).toEqual(NOTE_ALREADY_SENT);
      expect(
        await saveViolationNote(db, officer, "x", sent(one), MOMENT),
      ).toEqual(NOTE_ALREADY_SENT);
    });
  });

  it("refuses a student who is not Aktif or not there", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [, , away = ""] = studentIds;
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, away));

      expect(
        await saveViolationNote(
          db,
          officer,
          crypto.randomUUID(),
          sent(away),
          MOMENT,
        ),
      ).toEqual(NOT_WRITABLE);
      expect(
        await saveViolationNote(
          db,
          officer,
          crypto.randomUUID(),
          sent(crypto.randomUUID()),
          MOMENT,
        ),
      ).toEqual(NOT_WRITABLE);
    });
  });

  it("lets Kepala Unit save a note", async () => {
    await inTestDatabase(async (db) => {
      const { studentIds } = await setting(db);
      const head = await addNoteActor(db, "Kepala Uji Simpan", [
        "head_of_unit",
      ]);

      const saved = await saveViolationNote(
        db,
        head,
        crypto.randomUUID(),
        sent(studentIds[0] ?? ""),
        MOMENT,
      );

      expect(saved.ok).toBe(true);
    });
  });

  it.each([
    "director",
    "head_of_program",
    "mentor",
    "student",
    "bam_bphk",
  ] as const)("refuses a hand-made save of %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { studentIds } = await setting(db);
      const actor = await addNoteActor(db, "Bukan Penulis Uji", [role]);
      const id = crypto.randomUUID();

      expect(
        await saveViolationNote(
          db,
          actor,
          id,
          sent(studentIds[0] ?? ""),
          MOMENT,
        ),
      ).toEqual(NOT_ALLOWED_TO_WRITE);
      expect(await noteAt(db, id)).toBeUndefined();
    });
  });
});
