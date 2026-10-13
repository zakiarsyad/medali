import { campusDay } from "@/academic-periods/campus-day";

/**
 * Whether a photo was sent outside the dates of its schedule: on a day,
 * on campus, before the first or after the last day of it. Such a photo
 * may still be valid, as the upload stays open after the last day; the
 * card only points it out.
 */
export function isOutsideDates(
  sentAt: Date,
  schedule: { startsOn: string; endsOn: string },
): boolean {
  const day = campusDay(sentAt);
  return day < schedule.startsOn || day > schedule.endsOn;
}
