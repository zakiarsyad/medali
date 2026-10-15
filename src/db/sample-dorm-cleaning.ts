import { daysAfter } from "@/academic-periods/days-after";
import type { DormId } from "@/dorms/dorms";

/** The cleaning places every dorm starts with, as the prototype has them. */
export const SAMPLE_CLEANING_PLACES = [
  "Lapangan Apel",
  "Ruang Komunal",
  "Ruang Mesin Cuci",
  "Kamar Mandi",
] as const;

/**
 * The dorms whose sample rooms get cleaning duties. Wismantara takes no
 * part in cleaning until its rooms are plotted for it.
 */
export const SAMPLE_DUTY_DORMS = [
  "dana_rakca",
  "cipta_bakti",
] as const satisfies readonly DormId[];

/** How many days before and after the day the sample duties reach. */
const DAYS_AROUND = 3;

export interface SampleDuty {
  day: string;
  place: (typeof SAMPLE_CLEANING_PLACES)[number];
  roomNumber: string;
}

/**
 * One duty for each sample place of a dorm on each day from three days
 * before `today` to three days after, given to its rooms with residents
 * in turn. No rooms give no duties.
 */
export function sampleCleaningDuties(
  today: string,
  roomNumbers: readonly string[],
): SampleDuty[] {
  if (roomNumbers.length === 0) return [];
  const duties: SampleDuty[] = [];
  let turn = 0;
  for (let offset = -DAYS_AROUND; offset <= DAYS_AROUND; offset += 1) {
    const day = daysAfter(today, offset);
    for (const place of SAMPLE_CLEANING_PLACES) {
      const roomNumber = roomNumbers[turn % roomNumbers.length] ?? "";
      duties.push({ day, place, roomNumber });
      turn += 1;
    }
  }
  return duties;
}
