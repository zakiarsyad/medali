import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import type { SentNote } from "@/health-notes/health-input";
import {
  type NotePlace,
  type SavedNote,
  saveNote,
} from "@/health-notes/save-note";
import type { Parsed } from "@/parsed";
import { dormCohortsOn, writableFor } from "./health-subject";

export const NOT_ALLOWED_TO_WRITE = {
  ok: false,
  error:
    "Anda tidak berhak menulis catatan kesehatan. Catatan kesehatan mahasiswa non asrama diisi oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
} as const;

/**
 * What a save answers for a student the account may not write a note
 * for here: one who is not Aktif, is outside its students, or lives in
 * the dorm, whose notes are written on Asrama > Kesehatan.
 */
export const NOT_WRITABLE = {
  ok: false,
  error:
    "Catatan tidak disimpan: mahasiswa ini tidak dapat dipilih di sini. Catatan kesehatan penghuni asrama diisi di menu Asrama > Kesehatan.",
} as const;

/** Penilaian jasmani: Aktif students who live in no dorm. */
const PENILAIAN: NotePlace = {
  writable: async (db, actor, day) =>
    writableFor(actor, await dormCohortsOn(db, day)),
  notWritable: NOT_WRITABLE,
};

/**
 * "Simpan catatan" on Penilaian jasmani: keeps a health note of an Aktif
 * student who lives in no dorm, as the work of the actor. Refused, with
 * nothing kept, for a role without the right "Penilaian jasmani", and as
 * saveNote refuses.
 */
export async function saveHealthNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentNote,
  limits: FitnessLimits,
  moment: Date = new Date(),
): Promise<Parsed<SavedNote>> {
  if (!may(actor.roles, "enter_fitness_scores")) return NOT_ALLOWED_TO_WRITE;
  return saveNote(db, actor, id, sent, limits, PENILAIAN, moment);
}
