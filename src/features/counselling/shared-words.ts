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
  counselling: "Status konseling",
  summary: "Ringkasan konselor",
};

/** The parts a student agreed to share, in one line, in the order of the form. */
export function sharedPartsLine(data: readonly SharedData[]): string {
  return inFormOrder(SHARED_DATA, data)
    .map((part) => SHARED_PART_WORDS[part])
    .join(", ");
}

/** What the list says when nothing is published for the recipient. */
export function nothingSharedWords(menteesOnly: boolean): string {
  const whom = menteesOnly ? "anak asuh Anda" : "Anda";
  return `Belum ada data kesehatan mental yang dipublikasikan untuk ${whom}.`;
}
