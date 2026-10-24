/*
 * How the panel "Indikator penilaian" writes the indicators. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

import { DAY } from "@/ui/day";

/** The line a role that only reads the panel sees instead of "Simpan indikator". */
export const INDICATORS_READ_ONLY =
  "Indikator penilaian ditetapkan oleh Kepala Unit Pembangunan Karakter.";

/** The note while nobody has set the indicators yet. */
export const STARTING_NOTE =
  "Indikator awal: nilai MEDALI dengan indikator utama tingkat 1 dari Kurikulum.";

/** Who set the indicators last and when, or that they are the starting ones. */
export function indicatorsNote(set: { at: Date; by: string } | null): string {
  if (set === null) return STARTING_NOTE;
  return `Ditetapkan ${DAY.format(set.at)} oleh ${set.by}.`;
}
