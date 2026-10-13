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

/** What "Simpan catatan" tells the one who saved. */
export interface SavedNote {
  studentName: string;
}

/**
 * "Simpan catatan": keeps a note about one student as the work of the
 * actor, who is its writer whatever the form sent. Refused for any role
 * but Pengasuh, and for a student who is not an Aktif member of a group
 * the actor holds today.
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
    await tx
      .insert(mentoringNotes)
      .values({ ...input, writtenBy: actor.id, writtenAt: WRITTEN_NOW });
    return { ok: true, value: { studentName: student.name } };
  });
}
