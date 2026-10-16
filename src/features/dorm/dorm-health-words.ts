/*
 * How Asrama > Kesehatan writes its facts. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

import type { RowLimit } from "@/auth/access";

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

/** What the list says when nobody matches. */
export const NOBODY_SICK =
  "Tidak ada mahasiswa asrama yang sakit pada filter ini.";

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
