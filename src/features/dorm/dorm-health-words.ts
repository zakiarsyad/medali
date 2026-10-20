/*
 * How Asrama > Kesehatan writes its facts. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

import type { RowLimit } from "@/auth/access";
import { savedNoteMessage } from "@/health-notes/health-words";
import { MARK_SAVED_TOO, savedMarkMessage } from "./mental-health-mark-words";
import type { DormHealthSaved } from "./save-dorm-health-note";

/** The line under the tab's title, as in the prototype. */
export const DORM_HEALTH_LEDE =
  "Catatan kesehatan penghuni asrama dan daftar mahasiswa asrama yang sakit atau memiliki riwayat penyakit, beserta kategori kesehatan jasmaninya. Kategori akhir adalah yang lebih berat antara hasil tes kebugaran dan catatan kesehatan.";

/** How the list and its numbers name the residents. */
export const RESIDENT_NOUN = "penghuni";

/** How the line of an illness names the residents it counts. */
export const LISTED_NOUN = "mahasiswa asrama";

/** What a role that reads the list sees where the form would be. */
export const LIST_READER_NOTE =
  "Catatan kesehatan penghuni asrama diisi oleh BAM - Kesehatan dan Kepala Unit Pembangunan Karakter. Anda dapat melihat daftar mahasiswa asrama yang sakit di bawah.";

/** What a role that sees the numbers only is told where the form would be. */
export const NUMBERS_ONLY_NOTE =
  "Catatan kesehatan penghuni asrama diisi oleh BAM - Kesehatan dan Kepala Unit Pembangunan Karakter. Nama, riwayat penyakit, dan catatan penghuni tidak ditampilkan untuk peran Anda, hanya angkanya.";

/** What shows in place of the numbers below 5 residents in reach, as in the prototype. */
export const TOO_FEW_LINE =
  "Rekap ditampilkan setelah minimal 5 penghuni, agar identitas tidak dapat ditebak.";

/** What the list says when nobody matches. */
export const NOBODY_SICK =
  "Tidak ada mahasiswa asrama yang sakit pada filter ini.";

/** The hint of "Perlu tindak lanjut medis": how many lack a note, or that none does. */
export function withoutNoteHint(withoutNote: number | "<5"): string {
  if (withoutNote === 0) return "catatan lengkap";
  return `${withoutNote.toLocaleString("id-ID")} belum punya catatan`;
}

/** The dorms of the residents, the hint of "Penghuni asrama" for who sees them all. */
const EVERY_DORM = "Wismantara, Dana Rakca, Cipta Bakti";

/**
 * The hint of "Penghuni asrama": whose residents the numbers count, as
 * the account's row limit for them says.
 */
export function reachHint(limit: RowLimit): string {
  if (limit.kind === "all") return EVERY_DORM;
  const ownMentees = limit.menteesOf.length > 0;
  const ownProgram = limit.studyProgramIds.length > 0;
  if (ownMentees && ownProgram) return "anak asuh dan prodi Anda";
  if (ownMentees) return "anak asuh Anda";
  return "prodi Anda";
}

/** What the form says of a save that was kept: the note, the mark, or both. */
export function savedDormHealthMessage(saved: DormHealthSaved): string {
  if (saved.category === null) return savedMarkMessage(saved.name);
  const note = savedNoteMessage(saved.name, saved.category);
  if (!saved.markSaved) return note;
  return `${note} ${MARK_SAVED_TOO}`;
}
