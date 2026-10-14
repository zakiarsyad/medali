import { stageNameOf } from "@/academic-periods/stages";
import { shownDay } from "@/ui/day";
import type { ShownChoice } from "./chosen-participants";
import type { ScheduleTarget } from "./schedule-row";
import {
  UPLOAD_UNIT_WORDS,
  type UploadRange,
  uploadDeadline,
} from "./upload-range";

/** A day without its year, such as 13 Okt, in campus time. */
const DAY_AND_MONTH = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Jakarta",
});

function shortDay(day: string): string {
  return DAY_AND_MONTH.format(new Date(`${day}T00:00:00+07:00`));
}

/** A whole number as the screens write it, such as 1.250. */
export function shownCount(count: number): string {
  return count.toLocaleString("id-ID");
}

/** The day of a schedule, or its first and last day when it has several. */
export function shownDays(startsOn: string, endsOn: string): string {
  if (startsOn === endsOn) return shownDay(startsOn);
  return `${shortDay(startsOn)} – ${shownDay(endsOn)}`;
}

/** The hours of a schedule, such as 07:30–11:30. */
export function shownHours(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}

/** Until when a photo may be uploaded, with the range that gives that day. */
export function uploadWords(range: UploadRange): string {
  const unit = UPLOAD_UNIT_WORDS[range.uploadUnit];
  const deadline = shortDay(uploadDeadline(range));
  return `Unggah s.d. ${deadline} (${range.uploadCount} ${unit})`;
}

/** Whom a schedule is for, such as Semester 3 (Penumbuhan). */
export function targetWords(semester: number): string {
  return `Semester ${semester} (${stageNameOf(semester)})`;
}

/**
 * Whom a schedule of an extra activity is for: how many students were
 * chosen one by one, the classes, one angkatan, or two and more.
 */
export function choiceWords(choice: ShownChoice): string {
  switch (choice.kind) {
    case "students":
      return `${shownCount(choice.chosen)} mahasiswa terpilih`;
    case "classes":
      return `Kelas ${choice.classNames.join(", ")}`;
    case "cohorts":
      if (choice.cohortYears.length === 1) {
        return `Angkatan ${choice.cohortYears[0]}`;
      }
      return `Lintas angkatan ${choice.cohortYears.join(", ")}`;
  }
}

/** Whom any schedule is for, as Sasaran shows it. */
export function sasaranWords(target: ScheduleTarget): string {
  if (target.kind === "semester") return targetWords(target.semester);
  return choiceWords(target.choice);
}

/** How many take part, and the target of the activity when it has one. */
export function participantWords(
  participants: number,
  target: number | null,
): string {
  const counted = `${shownCount(participants)} peserta`;
  if (target === null) return counted;
  return `${counted} · target ${shownCount(target)}`;
}

/** The small line under the name: the place, "tidak wajib", the indicators. */
export function activityDetail(
  location: string,
  isRequired: boolean,
  indicatorCodes: readonly string[],
): string {
  const parts = [location === "" ? "-" : location];
  if (!isRequired) parts.push("tidak wajib");
  if (indicatorCodes.length > 0) parts.push(indicatorCodes.join(", "));
  return parts.join(" · ");
}
