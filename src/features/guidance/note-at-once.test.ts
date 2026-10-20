// Sample NIMs of this file: 9944140000 to 9944140099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { SentNote } from "./note-input";
import { ALREADY_REMOVED } from "./note-messages";
import { removeViolationNote } from "./remove-violation-note";
import { saveViolationNote } from "./save-violation-note";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
  linesOf,
} from "./test-violation-notes";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("catatanpelanggaran");

// 10:00 on campus on 20 October 2026.
const MOMENT = new Date("2026-10-20T03:00:00Z");

interface Setting {
  officer: AccountForAccess;
  studentIds: string[];
}

let setting: Setting | undefined;

/** The periods, the students and Pembina Disiplin Mahasiswa, once for the file. */
async function prepared(): Promise<Setting> {
  if (setting) return setting;
  await addNotePeriods(own.db, 2026);
  const { studentIds } = await addNoteStudents(
    own.db,
    "Prodi Uji Catatan Sekaligus",
    "Mahasiswa Uji Catatan Sekaligus",
    ["9944140001", "9944140002"],
  );
  const officer = await addNoteActor(own.db, "Pembina Uji Sekaligus", [
    "discipline_officer",
  ]);
  setting = { officer, studentIds };
  return setting;
}

function sent(studentId: string): SentNote {
  return {
    studentId,
    day: "2026-10-20",
    description: "Terlambat mengikuti apel pagi",
    punishment: "warning",
    otherPunishment: "",
    remark: "",
  };
}

describe("Simpan catatan pressed twice at the same moment", () => {
  it("keeps the note once: the second waits, then answers the same, and the log has one line", async () => {
    const { officer, studentIds } = await prepared();
    const id = crypto.randomUUID();
    const note = sent(studentIds[0] ?? "");

    const both = await own.atOnce(
      (db) => saveViolationNote(db, officer, id, note, MOMENT),
      (db) => saveViolationNote(db, officer, id, note, MOMENT),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { name: "Mahasiswa Uji Catatan Sekaligus 1", category: "first" },
    });
    expect(both.later).toEqual(both.sooner);
    expect(await linesOf(own.db, id)).toHaveLength(1);
  });
});

describe("two removals of one note at the same moment", () => {
  it("lets the first win whole: the second waits, then is told it is already removed, and the log has one removal", async () => {
    const { officer, studentIds } = await prepared();
    const head = await addNoteActor(own.db, "Kepala Uji Sekaligus", [
      "head_of_unit",
    ]);
    const id = crypto.randomUUID();
    const saved = await saveViolationNote(
      own.db,
      officer,
      id,
      sent(studentIds[1] ?? ""),
      MOMENT,
    );
    if (!saved.ok) throw new Error(saved.error);

    const both = await own.atOnce(
      (db) => removeViolationNote(db, officer, id, MOMENT),
      (db) => removeViolationNote(db, head, id, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(ALREADY_REMOVED);
    const lines = await linesOf(own.db, id);
    expect(lines.map((line) => line.action)).toEqual(["added", "removed"]);
  });
});
