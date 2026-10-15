import { daysAfter } from "@/academic-periods/days-after";

/**
 * The day a "Pembersihan ulang" goes to: the day after `validatedOn`, or
 * the first later day that is not among `takenDays`, the days its place,
 * or the room's own room, already has a duty.
 */
export function repeatDay(
  validatedOn: string,
  takenDays: readonly string[],
): string {
  let day = daysAfter(validatedOn, 1);
  while (takenDays.includes(day)) {
    day = daysAfter(day, 1);
  }
  return day;
}
