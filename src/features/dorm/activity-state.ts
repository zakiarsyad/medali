import type { CampusMoment } from "@/academic-periods/campus-clock";

/** Where an activity of one day stands at a moment. */
export type ActivityState = "coming" | "today_not_started" | "running" | "over";

export const STATE_WORDS: Record<ActivityState, string> = {
  coming: "Akan datang",
  today_not_started: "Hari ini, belum dimulai",
  running: "Berlangsung",
  over: "Selesai",
};

/** An activity on a day, with the hour and minute it starts and ends. */
export interface Held {
  day: string;
  startTime: string;
  endTime: string;
}

/**
 * The state of an activity of one day at a moment on campus. A later day
 * is still to come and an earlier one is over. Today it waits until its
 * first hour, runs up to and with its last minute, and is over after it.
 */
export function activityState(held: Held, now: CampusMoment): ActivityState {
  if (held.day > now.day) return "coming";
  if (held.day < now.day) return "over";
  if (now.time < held.startTime) return "today_not_started";
  if (now.time > held.endTime) return "over";
  return "running";
}
