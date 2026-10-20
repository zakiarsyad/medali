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
import { dormWritableFor } from "./dorm-health-subject";

export const NOT_ALLOWED_TO_WRITE_DORM = {
  ok: false,
  error:
    "Anda tidak berhak menulis catatan kesehatan. Catatan kesehatan penghuni asrama diisi oleh BAM - Kesehatan dan Kepala Unit Pembangunan Karakter.",
} as const;

/**
 * What a save answers for a student the account may not write a note
 * for here: one who is not Aktif, or lives in no dorm, whose notes are
 * written on Penilaian jasmani.
 */
export const NOT_A_RESIDENT = {
  ok: false,
  error:
    "Catatan tidak disimpan: mahasiswa ini bukan penghuni asrama aktif. Catatan kesehatan mahasiswa non asrama diisi di menu Penilaian > Penilaian jasmani.",
} as const;

/** Asrama > Kesehatan: Aktif dorm residents. */
const ASRAMA: NotePlace = {
  writable: dormWritableFor,
  notWritable: NOT_A_RESIDENT,
};

/**
 * "Simpan catatan" on Asrama > Kesehatan: keeps a health note of an
 * Aktif dorm resident, as the work of the actor. Refused, with nothing
 * kept, for a role without the right to write residents' notes, and as
 * saveNote refuses.
 */
export async function saveDormHealthNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentNote,
  limits: FitnessLimits,
  moment: Date = new Date(),
): Promise<Parsed<SavedNote>> {
  if (!may(actor.roles, "write_dorm_health_notes")) {
    return NOT_ALLOWED_TO_WRITE_DORM;
  }
  return saveNote(db, actor, id, sent, limits, ASRAMA, moment);
}
