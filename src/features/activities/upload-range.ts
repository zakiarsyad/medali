import { daysAfter } from "@/academic-periods/days-after";
import type { uploadUnit } from "@/db/schema";

/** What the upload range of a schedule is counted in. */
export type UploadUnit = (typeof uploadUnit.enumValues)[number];

/** The units in the order the form offers them, each as the screens say it. */
export const UPLOAD_UNIT_WORDS: Record<UploadUnit, string> = {
  day: "hari",
  week: "minggu",
};

const DAYS_IN_UNIT: Record<UploadUnit, number> = { day: 1, week: 7 };

/** The longest upload range, in either unit. */
export const UPLOAD_COUNT_MAX = 52;

/** The parts of a schedule that say until when a photo may be uploaded. */
export interface UploadRange {
  endsOn: string;
  uploadCount: number;
  uploadUnit: UploadUnit;
}

/**
 * The last day an attendance photo may be uploaded: the last day of the
 * schedule plus its upload range. A range of 0 ends on that last day.
 */
export function uploadDeadline(range: UploadRange): string {
  const days = range.uploadCount * DAYS_IN_UNIT[range.uploadUnit];
  return daysAfter(range.endsOn, days);
}
