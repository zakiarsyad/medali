import { daysAfter } from "@/academic-periods/days-after";
import { runningPeriodOn } from "@/academic-periods/running-period";
import type { SampleActivitySchedule } from "./sample-activity-schedules";
import { SAMPLE_SPECIAL_ACTIVITIES, type SamplePeriod } from "./sample-data";

/*
 * Made-up schedules only. Every day, hour, place, class and angkatan here
 * is invented, and each class and angkatan is one the sample students
 * have.
 */

/** One class or one angkatan a schedule is for. */
export type SampleParticipant = { className: string } | { cohortYear: number };

/** A schedule of a special or additional activity, with whom it is for. */
export interface SampleExtraSchedule extends SampleActivitySchedule {
  participants: SampleParticipant[];
}

interface ExtraSlot {
  activityName: string;
  /** Days from today to the first day: below zero for a day gone by. */
  startsIn: number;
  /** How many days it lasts, the first one counted. */
  days: number;
  startTime: string;
  endTime: string;
  location: string;
  participants: SampleParticipant[];
}

/**
 * The prototype's leadership training of two angkatan, which is over,
 * and peer mentoring for two classes, whose upload is open today.
 */
const EXTRA_SLOTS: ExtraSlot[] = [
  {
    activityName: "Pelatihan kepemimpinan organisasi mahasiswa",
    startsIn: -20,
    days: 2,
    startTime: "08:00",
    endTime: "15:00",
    location: "Auditorium Kampus Bintaro",
    participants: [{ cohortYear: 2023 }, { cohortYear: 2024 }],
  },
  {
    activityName: "Program mentor sebaya",
    startsIn: -1,
    days: 1,
    startTime: "13:00",
    endTime: "16:00",
    location: "Aula asrama",
    participants: [{ className: "2-01" }, { className: "2-02" }],
  },
];

function isRequiredActivity(activityName: string): boolean {
  const activity = SAMPLE_SPECIAL_ACTIVITIES.find(
    (each) => each.name === activityName,
  );
  if (!activity) throw new Error(`No sample activity ${activityName}.`);
  return activity.isRequired;
}

/**
 * The made-up schedules of the special and additional activities around
 * a day, each with the sample period that runs on its first day. One
 * whose first day has no period is left out. `periods` are the sample
 * periods.
 */
export function sampleExtraSchedules(
  day: string,
  periods: SamplePeriod[],
): SampleExtraSchedule[] {
  const schedules: SampleExtraSchedule[] = [];
  for (const slot of EXTRA_SLOTS) {
    const { startsIn, days, ...kept } = slot;
    const startsOn = daysAfter(day, startsIn);
    const period = runningPeriodOn(periods, startsOn);
    if (period === null) continue;
    schedules.push({
      ...kept,
      period,
      startsOn,
      endsOn: daysAfter(startsOn, days - 1),
      uploadCount: 1,
      uploadUnit: "week",
      isRequired: isRequiredActivity(slot.activityName),
    });
  }
  return schedules;
}
