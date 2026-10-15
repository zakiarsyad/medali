import { daysAfter } from "@/academic-periods/days-after";
import type { DormId } from "@/dorms/dorms";
import type {
  CleaningResult,
  CleaningStatus,
} from "@/features/dorm/cleaning-ids";
import { repeatDay } from "@/features/dorm/cleaning-repeat-day";

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

/** Every this many duties in turn, one is judged Tidak memenuhi. */
const NOT_MET_EVERY = 5;

/** The Catatan of a sample Tidak memenuhi, as the prototype has it. */
export const SAMPLE_NOT_MET_NOTE = "Masih ada sampah dan lantai belum dipel.";

export interface SampleDuty {
  day: string;
  place: (typeof SAMPLE_CLEANING_PLACES)[number];
  roomNumber: string;
  status: CleaningStatus;
  result: CleaningResult | null;
  /** The place in the list of the duty this one repeats, or null. */
  repeatOf: number | null;
}

/**
 * Where a sample duty stands: one of a past day is validated, but the
 * first of yesterday, which waits for Pengelola Asrama; every fifth in
 * turn of those is judged Tidak memenuhi.
 */
function outcomeOf(
  offset: number,
  turn: number,
  isFirstOfDay: boolean,
): Pick<SampleDuty, "status" | "result"> {
  if (offset >= 0) return { status: "scheduled", result: null };
  if (offset === -1 && isFirstOfDay) return { status: "judged", result: "met" };
  const result = turn % NOT_MET_EVERY === 2 ? "not_met" : "met";
  return { status: "validated", result };
}

/**
 * The "Pembersihan ulang" of each validated Tidak memenuhi: the same place
 * and room, on the next day its place is free, as the duty was validated
 * on its own day.
 */
function repeatsOf(duties: readonly SampleDuty[]): SampleDuty[] {
  const all = [...duties];
  duties.forEach((duty, index) => {
    if (duty.status !== "validated" || duty.result !== "not_met") return;
    const taken = all
      .filter((each) => each.place === duty.place)
      .map((each) => each.day);
    all.push({
      ...duty,
      day: repeatDay(duty.day, taken),
      status: "scheduled",
      result: null,
      repeatOf: index,
    });
  });
  return all.slice(duties.length);
}

/**
 * One duty for each sample place of a dorm on each day from three days
 * before `today` to three days after, given to its rooms with residents
 * in turn, with the judgements of the past days and the repeats of those
 * that were not met. No rooms give no duties.
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
      const isFirstOfDay = place === SAMPLE_CLEANING_PLACES[0];
      const outcome = outcomeOf(offset, turn, isFirstOfDay);
      duties.push({ day, place, roomNumber, ...outcome, repeatOf: null });
      turn += 1;
    }
  }
  return [...duties, ...repeatsOf(duties)];
}
