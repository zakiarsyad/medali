/*
 * How Data SKPM writes its numbers. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import { DAY } from "@/ui/day";
import type { SkpmUploadMode } from "./skpm-ids";

/** Each mode as "Unggah data SKPM" offers it. */
export const MODE_CHOICES = [
  ["add", "Tambahkan"],
  ["replace", "Ganti semua data"],
] as const satisfies readonly (readonly [SkpmUploadMode, string])[];

/** Each mode as "Riwayat unggahan" names it, in the prototype's words. */
export const MODE_WORDS: Record<SkpmUploadMode, string> = {
  add: "Tambahkan",
  replace: "Ganti semua",
};

/** What each mode does, over the columns. */
export const MODE_NOTES: Record<SkpmUploadMode, string> = {
  add: "Baris dalam unggahan ini ditambahkan ke data SKPM yang sudah ada.",
  replace:
    "Unggahan ini menggantikan seluruh data SKPM sebelumnya, dari semester mana pun.",
};

/** The confirm "Ganti semua data" asks before it saves. */
export const REPLACE_QUESTION =
  "Ganti semua data SKPM? Semua unggahan sebelumnya ditandai tergantikan dan tidak dihitung lagi.";

/** The confirm "Hapus" asks before it removes an upload. */
export function removeQuestion(fileName: string): string {
  return `Hapus unggahan ${fileName}? Nilai SKPM dihitung ulang tanpa data ini.`;
}

/** A number with one decimal, such as 60,0, or "-" for none. */
export function shownOneDecimal(amount: number | null): string {
  if (amount === null) return "-";
  return amount.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Points as written: whole, or with their decimals, such as 7,5. */
export function shownPoints(points: number): string {
  return points.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/** A text a file may leave empty, or "-". */
export function orDash(text: string | null): string {
  return text ?? "-";
}

/** Who set "Poin untuk nilai 100" last and when, or that it is the starting number. */
export function conversionNote(set: { at: Date; by: string } | null): string {
  if (set === null) return "Angka awal, sesuaikan dengan pedoman SKPM.";
  return `Ditetapkan ${DAY.format(set.at)} oleh ${set.by}.`;
}

/** The note for a role that only reads the tab. */
export function readOnlyNote(pointsForHundred: number): string {
  return `Data SKPM diunggah oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa. Nilai SKPM dihitung dari total poin: ${pointsForHundred.toLocaleString("id-ID")} poin setara nilai 100.`;
}
