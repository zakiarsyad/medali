import { daysAfter } from "@/academic-periods/days-after";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { studentSemester } from "@/academic-periods/student-semester";
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
 * Holdings for the students in their second year, so that one sample
 * student has a whole history to show: three that are over, two whose
 * upload is still open after their last day, and two to come.
 */
const SECOND_YEAR_SLOTS: Slot[] = [
  { startsIn: -60, days: 1, ...MORNING, ...ONE_DAY, location: "Aula asrama" },
  {
    startsIn: -37,
    days: 1,
    ...AFTERNOON,
    ...ONE_DAY,
    location: "Lapangan asrama",
  },
  {
    startsIn: -23,
    days: 1,
    ...MORNING,
    ...ONE_DAY,
    location: "Auditorium Kampus Bintaro",
  },
  { startsIn: -6, days: 1, ...EVENING, ...ONE_WEEK, location: "Aula asrama" },
  {
    startsIn: -3,
    days: 1,
    ...AFTERNOON,
    ...ONE_WEEK,
    location: "Ruang belajar tiap asrama",
  },
  {
    startsIn: 8,
    days: 1,
    ...MORNING,
    ...ONE_DAY,
    location: "Lingkungan asrama",
  },
  { startsIn: 19, days: 1, ...AFTERNOON, ...ONE_DAY, location: "" },
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
 * more than one semester and tahap, and then those held for the students
 * in their second year. `periods` are the sample periods.
 */
export function sampleActivitySchedules(
  day: string,
  periods: SamplePeriod[],
): SampleActivitySchedule[] {
  const schedules: SampleActivitySchedule[] = [];
  for (const [place, slot] of SLOTS.entries()) {
    const period = runningPeriodOn(periods, daysAfter(day, slot.startsIn));
    if (period === null) continue;
    const activities = activitiesOfTerm(period.term);
    const activity = activities[place % activities.length];
    if (activity === undefined) continue;
    schedules.push(holdingOf(slot, day, period, activity));
  }
  const secondYear = secondYearCohort(day, periods);
  for (const slot of SECOND_YEAR_SLOTS) {
    const period = runningPeriodOn(periods, daysAfter(day, slot.startsIn));
    if (period === null || secondYear === null) continue;
    const semester = studentSemester(secondYear, period);
    const activity = SAMPLE_PPKS_ACTIVITIES.find(
      (each) => each.semester === semester,
    );
    if (activity === undefined) continue;
    schedules.push(holdingOf(slot, day, period, activity));
  }
  return schedules;
}

/**
 * The angkatan that is in its second year in the period that runs on a
 * day: the one that started the year before that Tahun akademik.
 */
export function secondYearCohort(
  day: string,
  periods: SamplePeriod[],
): number | null {
  const running = runningPeriodOn(periods, day);
  return running === null ? null : running.startYear - 1;
}

function holdingOf(
  slot: Slot,
  day: string,
  period: SamplePeriod,
  activity: SamplePpksActivity,
): SampleActivitySchedule {
  const { startsIn, days, ...kept } = slot;
  const startsOn = daysAfter(day, startsIn);
  return {
    ...kept,
    activityName: activity.name,
    period,
    startsOn,
    endsOn: daysAfter(startsOn, days - 1),
    isRequired: activity.isRequired,
  };
}
