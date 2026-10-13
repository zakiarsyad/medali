import { daysAfter } from "@/academic-periods/days-after";
import { runningPeriodOn } from "@/academic-periods/running-period";
import {
  SAMPLE_PPKS_ACTIVITIES,
  type SamplePeriod,
  type SamplePpksActivity,
} from "./sample-data";

/*
 * Made-up schedules only. Every day, hour and place here is invented.
 */

export interface SampleActivitySchedule {
  /** The name of the sample PPKS activity that is held. */
  activityName: string;
  /** The sample period that runs on the first day. */
  period: SamplePeriod;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  uploadCount: number;
  uploadUnit: "day" | "week";
  location: string;
  isRequired: boolean;
}

/** One holding, told by how far its first day is from today. */
interface Slot {
  /** Days from today to the first day: below zero for a day gone by. */
  startsIn: number;
  /** How many days it lasts, the first one counted. */
  days: number;
  startTime: string;
  endTime: string;
  uploadCount: number;
  uploadUnit: "day" | "week";
  location: string;
}

const MORNING = { startTime: "07:30", endTime: "11:30" };
const AFTERNOON = { startTime: "13:00", endTime: "16:00" };
const EVENING = { startTime: "19:00", endTime: "21:00" };
const ONE_DAY = { uploadCount: 1, uploadUnit: "day" } as const;
const ONE_WEEK = { uploadCount: 1, uploadUnit: "week" } as const;

/**
 * Holdings that are over, some of them in an earlier period, three whose
 * upload is open today or opens this evening, and three still to come.
 */
const SLOTS: Slot[] = [
  {
    startsIn: -210,
    days: 1,
    ...MORNING,
    ...ONE_DAY,
    location: "Auditorium Kampus Bintaro",
  },
  { startsIn: -190, days: 2, ...MORNING, ...ONE_WEEK, location: "Aula asrama" },
  {
    startsIn: -45,
    days: 1,
    ...MORNING,
    ...ONE_DAY,
    location: "Auditorium Kampus Bintaro",
  },
  {
    startsIn: -30,
    days: 3,
    ...AFTERNOON,
    ...ONE_DAY,
    location: "Lapangan asrama",
  },
  { startsIn: -16, days: 1, ...MORNING, ...ONE_WEEK, location: "" },
  {
    startsIn: -9,
    days: 1,
    ...AFTERNOON,
    uploadCount: 0,
    uploadUnit: "day",
    location: "Ruang belajar tiap asrama",
  },
  { startsIn: -2, days: 1, ...MORNING, ...ONE_WEEK, location: "Aula asrama" },
  {
    startsIn: -1,
    days: 2,
    ...MORNING,
    ...ONE_DAY,
    location: "Lingkungan asrama",
  },
  {
    startsIn: 0,
    days: 1,
    ...EVENING,
    ...ONE_DAY,
    location: "Asrama masing-masing",
  },
  {
    startsIn: 5,
    days: 1,
    ...MORNING,
    ...ONE_DAY,
    location: "Auditorium Kampus Bintaro",
  },
  { startsIn: 12, days: 2, ...AFTERNOON, ...ONE_WEEK, location: "Aula asrama" },
  { startsIn: 26, days: 1, ...MORNING, ...ONE_DAY, location: "" },
];

/**
 * The sample activities whose semester falls in a period of that term:
 * the odd semesters in Ganjil, the even ones in Genap. A holding of one
 * of them has students of that semester to take part.
 */
function activitiesOfTerm(term: SamplePeriod["term"]): SamplePpksActivity[] {
  const isOdd = term === "odd";
  return SAMPLE_PPKS_ACTIVITIES.filter(
    (activity) => (activity.semester % 2 === 1) === isOdd,
  );
}

/**
 * The made-up schedules around a day: each of an activity whose semester
 * is taught in the period that runs on its first day, so the list shows
 * more than one semester and tahap. `periods` are the sample periods.
 */
export function sampleActivitySchedules(
  day: string,
  periods: SamplePeriod[],
): SampleActivitySchedule[] {
  const schedules: SampleActivitySchedule[] = [];
  for (const [place, slot] of SLOTS.entries()) {
    const { startsIn, days, ...kept } = slot;
    const startsOn = daysAfter(day, startsIn);
    const period = runningPeriodOn(periods, startsOn);
    if (period === null) continue;
    const activities = activitiesOfTerm(period.term);
    const activity = activities[place % activities.length];
    if (activity === undefined) continue;
    schedules.push({
      ...kept,
      activityName: activity.name,
      period,
      startsOn,
      endsOn: daysAfter(startsOn, days - 1),
      isRequired: activity.isRequired,
    });
  }
  return schedules;
}
