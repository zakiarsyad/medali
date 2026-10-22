import { SHARED_DATA, type SharedData } from "./sharing-ids";
import { inFormOrder } from "./sharing-words";

/*
 * The words of "Data yang dipublikasikan untuk Anda", as in the
 * prototype. Read by the screen parts in the browser, so nothing here
 * may take from the database code.
 */

export const SHARED_HEADING = "Data yang dipublikasikan untuk Anda";

/** Each part of "Data yang dibagikan", as a recipient reads it. */
export const SHARED_PART_WORDS: Record<SharedData, string> = {
  level: "Tingkat asesmen",
  counselling: "Status konseling",
  summary: "Ringkasan konselor",
};

/** The parts a student agreed to share, in one line, in the order of the form. */
export function sharedPartsLine(data: readonly SharedData[]): string {
  return inFormOrder(SHARED_DATA, data)
    .map((part) => SHARED_PART_WORDS[part])
    .join(", ");
}

/** "Tingkat" of a student whose sharing leaves the level out. */
export const LEVEL_NOT_SHARED = "Tidak dibagikan";

/** "Tingkat" of a student whose level is shared and who has no screening. */
export const NOT_SCREENED = "Belum ada asesmen";

/** "Rincian" asked for a student whose data is no longer published for the person. */
export const SHARED_GONE =
  "Data ini tidak lagi dibagikan untuk Anda. Muat ulang halaman untuk melihat daftar terbaru.";

export const SHARED_NOT_ALLOWED =
  "Anda tidak memiliki hak untuk membaca data kesehatan mental yang dibagikan.";

/** The line under "Rincian", as in the prototype. */
export function publishedLine(name: string, day: string): string {
  return `Dipublikasikan ${name} pada ${day} dengan persetujuan mahasiswa. Gunakan hanya untuk keperluan pendampingan dan jangan disebarluaskan.`;
}

/** What the list says when nothing is published for the recipient. */
export function nothingSharedWords(menteesOnly: boolean): string {
  const whom = menteesOnly ? "anak asuh Anda" : "Anda";
  return `Belum ada data kesehatan mental yang dipublikasikan untuk ${whom}.`;
}
