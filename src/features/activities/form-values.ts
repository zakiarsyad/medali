import { runningPeriodOn } from "@/academic-periods/running-period";
import type { ActivityChoice } from "./activity-choice";
import {
  draftOf,
  type ParticipantDraft,
  type ParticipantPool,
  type PickedStudent,
  STARTING_DRAFT,
} from "./participant-draft";
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

/** What the form of an extra activity needs for its Peserta part. */
export interface ExtraFormParts {
  pool: ParticipantPool;
  /**
   * The students each schedule of the page names one by one, by its key,
   * so "Ubah" opens with them.
   */
  picked: Record<string, PickedStudent[]>;
}

/** What the form needs besides the schedule it is open for. */
export interface FormParts {
  /** The activities of the tab's kind that are in the Kurikulum list. */
  choices: ActivityChoice[];
  /** Null on the tab of PPKS activities. */
  extra: ExtraFormParts | null;
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
  if (activity.semester === null) return 0;
  const period = runningPeriodOn(parts.periods, startsOn);
  return countParticipants(parts.counts, activity.semester, period);
}

/**
 * The Peserta part as it opens: nothing picked for a new schedule, and
 * what a schedule of an extra activity holds when it is changed.
 */
export function draftFor(
  schedule: ScheduleRow | null,
  extra: ExtraFormParts,
): ParticipantDraft {
  if (schedule === null || schedule.target.kind !== "chosen") {
    return STARTING_DRAFT;
  }
  const picked = extra.picked[schedule.id] ?? [];
  return draftOf(schedule.target.choice, picked);
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
 * The activity a schedule holds, as the form offers it: with the semester
 * of a PPKS one, or none for a special or additional one.
 */
export function keptChoice(schedule: ScheduleRow): ActivityChoice {
  const { target } = schedule;
  const semester = target.kind === "semester" ? target.semester : null;
  return { ...schedule.activity, semester };
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
