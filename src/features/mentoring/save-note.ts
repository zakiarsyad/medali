import { and, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentoringNotes, students } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { writableFor } from "./mentees";
import type { NoteInput } from "./note-input";
import { writtenRowsFor } from "./visible-notes";

/** What a save answers to any role but Pengasuh. */
export const NOT_ALLOWED_TO_WRITE = {
  ok: false,
  error: "Catatan pendampingan hanya diisi oleh pengasuh.",
} as const;

/**
 * What a save answers for every student the writer may not write for: one
 * of another mentor's group, one in no group, one who is not Aktif and one
 * who does not exist. The one answer tells nothing about a student the
 * writer may not see.
 */
export const NOT_OWN_MENTEE = {
  ok: false,
  error:
    "Mahasiswa ini bukan anak asuh aktif Anda. Pilih mahasiswa dari kelompok yang Anda asuh saat ini.",
} as const;

/** What a save answers when its key is that of another note. */
export const FORM_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim. Muat ulang halaman, lalu isi catatan lagi.",
} as const;

/** What "Simpan catatan" tells the one who saved. */
export interface SavedNote {
  studentName: string;
}

/**
 * Adds the note unless one with its key is there already. Two saves of
 * one key at the same moment do not both add it: the second waits for
 * the first, then adds nothing.
 */
async function addOnce(
  tx: Database,
  actorId: string,
  input: NoteInput,
): Promise<boolean> {
  const added = await tx
    .insert(mentoringNotes)
    .values({ ...input, writtenBy: actorId, writtenAt: WRITTEN_NOW })
    .onConflictDoNothing({ target: mentoringNotes.id })
    .returning({ id: mentoringNotes.id });
  return added.length > 0;
}

/**
 * Whether the note kept under a key is the one this form sent before: by
 * the same writer, about the same student. A key of any other note is
 * not the form's own, and nothing of that note is told or changed.
 */
async function isSameForm(
  tx: Database,
  actorId: string,
  input: NoteInput,
): Promise<boolean> {
  const [kept] = await tx
    .select({
      writtenBy: mentoringNotes.writtenBy,
      studentId: mentoringNotes.studentId,
    })
    .from(mentoringNotes)
    .where(eq(mentoringNotes.id, input.id));
  if (!kept) return false;
  return kept.writtenBy === actorId && kept.studentId === input.studentId;
}

/**
 * "Simpan catatan": keeps a note about one student as the work of the
 * actor, who is its writer whatever the form sent. Refused for any role
 * but Pengasuh, and for a student who is not an Aktif member of a group
 * the actor holds today. A form sent twice, as by a double press, is kept
 * once, and the second answer is the same as the first.
 */
export async function saveNote(
  db: Database,
  actor: AccountForAccess,
  input: NoteInput,
): Promise<Parsed<SavedNote>> {
  const limit = writtenRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_WRITE;

  return db.transaction(async (tx) => {
    const [student] = await tx
      .select({ name: students.name })
      .from(students)
      .where(and(eq(students.id, input.studentId), writableFor(limit)));
    if (!student) return NOT_OWN_MENTEE;
    const saved = { ok: true, value: { studentName: student.name } } as const;
    if (await addOnce(tx, actor.id, input)) return saved;
    if (await isSameForm(tx, actor.id, input)) return saved;
    return FORM_ALREADY_SENT;
  });
}
