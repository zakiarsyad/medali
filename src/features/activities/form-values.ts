import { runningPeriodOn } from "@/academic-periods/running-period";
import type { ActivityChoice } from "./activity-choice";
import {
  type CohortCount,
  countParticipants,
  type PeriodParts,
} from "./participants";
import type { ScheduleRow } from "./schedule-row";
import type { UploadUnit } from "./upload-range";

/** A stored academic period, as far as the form reads it. */
export interface FormPeriod extends PeriodParts {
  startsOn: string;
}

/** What the form needs besides the schedule it is open for. */
export interface FormParts {
  /** The PPKS activities that are in the Kurikulum list. */
  choices: ActivityChoice[];
  periods: FormPeriod[];
  /** The Aktif students of each angkatan. */
  counts: CohortCount[];
  /** Today on campus, the first and last day a new schedule starts with. */
  today: string;
  /** The key for the next schedule a form adds. */
  newScheduleId: string;
}

/** What the fields of the form hold when it opens. */
export interface FormValues {
  activityId: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  uploadCount: number;
  uploadUnit: UploadUnit;
  location: string;
  isRequired: boolean;
}

/** A new schedule starts as one morning today, with 1 hari to upload. */
export function startingValues(today: string): FormValues {
  return {
    activityId: "",
    startsOn: today,
    endsOn: today,
    startTime: "07:30",
    endTime: "11:30",
    uploadCount: 1,
    uploadUnit: "day",
    location: "",
    isRequired: true,
  };
}

/**
 * How many students a schedule of an activity is for when it starts on a
 * day: those in the activity's semester during the academic period that
 * runs on that day. Nobody while no activity is chosen, and nobody for a
 * day that is not filled in or on which no period runs yet.
 */
export function participantsOn(
  parts: Pick<FormParts, "counts" | "periods">,
  activity: Pick<ActivityChoice, "semester"> | null,
  startsOn: string,
): number {
  if (activity === null || startsOn === "") return 0;
  const period = runningPeriodOn(parts.periods, startsOn);
  return countParticipants(parts.counts, activity.semester, period);
}

/** What the fields hold when the form opens to change a schedule. */
export function valuesOf(schedule: ScheduleRow): FormValues {
  return {
    activityId: schedule.activity.id,
    startsOn: schedule.startsOn,
    endsOn: schedule.endsOn,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    uploadCount: schedule.uploadCount,
    uploadUnit: schedule.uploadUnit,
    location: schedule.location,
    isRequired: schedule.isRequired,
  };
}

/**
 * The PPKS activity a schedule holds, as the form offers it, or null for
 * a schedule of an extra activity, which has no semester.
 */
export function keptChoice(schedule: ScheduleRow): ActivityChoice | null {
  const { target } = schedule;
  if (target.kind !== "semester") return null;
  return { ...schedule.activity, semester: target.semester };
}

/**
 * The activities the form offers: those in the Kurikulum list, and the
 * one the schedule already holds when it was removed from the list since,
 * so the schedule can be changed and keep it.
 */
export function choicesWith(
  choices: ActivityChoice[],
  kept: ActivityChoice | null,
): ActivityChoice[] {
  if (kept === null) return choices;
  const isOffered = choices.some((choice) => choice.id === kept.id);
  return isOffered ? choices : [...choices, kept];
}
