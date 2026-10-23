/*
 * How the health panels of Dashboard asrama say their numbers. Read by
 * the screen parts, so nothing here may take from the database code.
 */

import { type CountShown, countWords } from "@/health-notes/shown-count";
import { publishedLine } from "@/mental-health/published-words";
import type { DormPublishedRow } from "./dashboard-health-recap";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** What "Kesehatan jasmani penghuni" says instead of counts while 1 to 4 residents are tested. */
export const PHYSICAL_TOO_FEW =
  "Rekap ditampilkan setelah minimal 5 penghuni dites, agar identitas tidak dapat ditebak.";

/** What "Kesehatan jasmani penghuni" says while no resident in reach is tested. */
export const NOBODY_TESTED = "Belum ada hasil tes kebugaran penghuni.";

/** The heading of the residents who need care, for an account that may see their names. */
export const CARE_HEADING = "Perlu perhatian dan tindak lanjut medis";

/** What that part says with nobody who needs care. */
export const NOBODY_NEEDS_CARE = "Tidak ada.";

/** The link under it to the full list on Asrama > Kesehatan. */
export const CARE_LINK = "Daftar lengkap di Kesehatan";

/** The line beside "Kesehatan jasmani penghuni". */
export function testedLine(tested: number, residents: number): string {
  return `${shown(tested)} dari ${shown(residents)} sudah dites`;
}

/** What "Kesehatan mental penghuni" says instead of counts while 1 to 4 residents are assessed. */
export const MENTAL_TOO_FEW =
  "Rekap ditampilkan setelah minimal 5 penghuni diasesmen, agar identitas tidak dapat ditebak.";

/** What "Kesehatan mental penghuni" says while no resident in reach is assessed. */
export const NOBODY_ASSESSED = "Belum ada asesmen kesehatan mental penghuni.";

/** The heading of the residents whose data is published to the account. */
export const PUBLISHED_HEADING = "Data yang dipublikasikan konselor untuk Anda";

/** What that part says while nothing is published to the account. */
export const NOTHING_PUBLISHED =
  "Belum ada. Data perorangan hanya tampil bila konselor mempublikasikannya dengan persetujuan mahasiswa.";

/** The line under a published resident's name: the room, then only what was shared. */
export function publishedPlaceLine(row: DormPublishedRow): string {
  const shared = publishedLine(row, false);
  if (shared === "") return row.room;
  return `${row.room} · ${shared}`;
}

/** The line under the levels: how many are assessed, and the sessions as sent. */
export function assessedLine(assessed: number, sessions: CountShown): string {
  return `${shown(assessed)} penghuni sudah diasesmen · ${countWords(sessions)} sesi konseling 30 hari terakhir`;
}
