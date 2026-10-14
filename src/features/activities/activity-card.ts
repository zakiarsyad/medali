import type { CampusMoment } from "@/academic-periods/campus-clock";
import type { ValueKey } from "@/ui/medali-values";
import { ATTENDANCE_WORDS, takesNewPhoto } from "./attendance-status";
import { type BadgeLook, HISTORY_LOOKS, SCHEDULE_LOOKS } from "./badge-look";
import { STATUS_WORDS, scheduleStatus } from "./schedule-status";
import {
  rejectedWords,
  sentWords,
  untilWords,
  whenWords,
} from "./student-activity-words";
import type { StudentSchedule } from "./student-schedule";

/*
 * Read by the cards in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the cards.
 */

/**
 * A running schedule as its card shows it, every line in words already:
 * the server writes the days and hours, so each browser shows the same.
 */
export interface ActivityCard {
  id: string;
  name: string;
  /** The days, the hours and the place. */
  when: string;
  /** Until when a photo may be uploaded. */
  until: string;
  /** Empty when Kurikulum gives none. */
  description: string;
  valueKeys: ValueKey[];
  badge: { words: string; look: BadgeLook };
  /** What is said of the student's own photo, or null when nothing is. */
  photoLine: string | null;
  /** Whether "Unggah foto kehadiran" is offered. */
  maySend: boolean;
}

function photoLineOf(schedule: StudentSchedule): string | null {
  const { attendance } = schedule;
  if (attendance === null) return null;
  if (attendance.status === "rejected") return rejectedWords(attendance.note);
  if (attendance.status === "waiting" && attendance.sentAt !== null) {
    return sentWords(attendance.sentAt);
  }
  return null;
}

function badgeOf(
  schedule: StudentSchedule,
  now: CampusMoment,
): ActivityCard["badge"] {
  const { attendance } = schedule;
  if (attendance !== null) {
    return {
      words: ATTENDANCE_WORDS[attendance.status],
      look: HISTORY_LOOKS[attendance.status],
    };
  }
  const status = scheduleStatus(schedule, now);
  return { words: STATUS_WORDS[status], look: SCHEDULE_LOOKS[status] };
}

/**
 * Whether a student may send a photo for a schedule at a moment: while
 * its upload time is open, when they have sent nothing for it yet or
 * their photo was rejected. A photo that waits cannot be replaced.
 */
export function maySendPhoto(
  schedule: StudentSchedule,
  now: CampusMoment,
): boolean {
  if (!takesNewPhoto(schedule.attendance?.status ?? null)) return false;
  return scheduleStatus(schedule, now) === "open";
}

/** The card of a running schedule at a moment on campus. */
export function cardOf(
  schedule: StudentSchedule,
  now: CampusMoment,
): ActivityCard {
  return {
    id: schedule.id,
    name: schedule.name,
    when: whenWords(schedule),
    until: untilWords(schedule),
    description: schedule.description,
    valueKeys: schedule.valueKeys,
    badge: badgeOf(schedule, now),
    photoLine: photoLineOf(schedule),
    maySend: maySendPhoto(schedule, now),
  };
}
