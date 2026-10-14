import { daysAfter } from "@/academic-periods/days-after";
import type { DormId } from "@/dorms/dorms";
import { covers } from "@/features/dorm/activity-audience";
import { takesPlaceOn } from "@/features/dorm/activity-days";
import type { CountMarks } from "@/features/dorm/count-ids";
import type {
  SampleActivityVersion,
  SampleDormActivity,
} from "./sample-dorm-activities";

/*
 * Made-up counts only, of the made-up residents and activities.
 */

/** A sample activity with the key it was kept under. */
export interface KeptSampleActivity {
  id: string;
  sample: SampleDormActivity;
}

/** A sample resident and the dorm they live in. */
export interface SampleResident {
  id: string;
  dorm: DormId;
}

/**
 * Where a sample count stands: a draft, announced once, or announced and
 * then corrected with "Umumkan ulang".
 */
export type SampleCountStage = "draft" | "announced" | "corrected";

export interface SampleCount {
  activityId: string;
  day: string;
  /** The hour and minute the activity ended, such as 06:15. */
  endTime: string;
  stage: SampleCountStage;
  /** Every participant, as the count holds them now. */
  marks: CountMarks;
  /** What the first announcement of a corrected count held. */
  firstMarks: CountMarks | null;
}

/** How many days before today the samples are counted for: a week. */
const DAYS_COUNTED = 7;
/** One participant in this many is absent, at a place that moves each time. */
const ABSENT_EVERY = 11;
const ABSENT_NOTE = "Sakit, istirahat di kamar";
const LATE_NOTE = "Terlambat 10 menit";
const CORRECTED_NOTE = "Hadir, terlambat dicatat";

/** The version of a sample activity that takes place on a day, if any. */
function versionOn(
  sample: SampleDormActivity,
  day: string,
): SampleActivityVersion | undefined {
  return sample.versions.find((version) =>
    takesPlaceOn(
      { ...version, removedFrom: null, daysOff: sample.daysOff },
      day,
    ),
  );
}

interface Held {
  activityId: string;
  version: SampleActivityVersion;
}

/** The sample activities of one day, the earliest first. */
function heldOn(activities: KeptSampleActivity[], day: string): Held[] {
  const held: Held[] = [];
  for (const { id, sample } of activities) {
    const version = versionOn(sample, day);
    if (version) held.push({ activityId: id, version });
  }
  return held.sort((a, b) =>
    a.version.startTime < b.version.startTime ? -1 : 1,
  );
}

/**
 * The marks of the residents who take part: one in eleven is absent, at a
 * place moved by the day and the activity, half of them with a note, and
 * now and then a present one has a note too.
 */
function marksOf(participants: SampleResident[], shift: number): CountMarks {
  const marks: CountMarks = {};
  for (const [place, resident] of participants.entries()) {
    const turn = (place + shift) % ABSENT_EVERY;
    const isAbsent = turn === 0;
    const note = isAbsent && place % 2 === 0 ? ABSENT_NOTE : "";
    marks[resident.id] = { isAbsent, note: turn === 5 ? LATE_NOTE : note };
  }
  return marks;
}

/** The first announcement of a corrected count: one more was absent then. */
function beforeCorrection(marks: CountMarks): CountMarks {
  const first = { ...marks };
  const present = Object.entries(marks).find(([, mark]) => !mark.isAbsent);
  if (!present) return first;
  const [id] = present;
  first[id] = { isAbsent: true, note: "" };
  return first;
}

function correctedOf(marks: CountMarks): CountMarks {
  const corrected = { ...marks };
  const present = Object.entries(marks).find(([, mark]) => !mark.isAbsent);
  if (!present) return corrected;
  const [id] = present;
  corrected[id] = { isAbsent: false, note: CORRECTED_NOTE };
  return corrected;
}

/**
 * Where the count of an activity of a day stands. Yesterday's last
 * activity has no count yet and the one before it is a draft; the first
 * activity of two days ago was corrected; every other one is announced.
 */
function stageOf(
  daysBack: number,
  place: number,
  held: number,
): SampleCountStage | null {
  if (daysBack === 1 && place === held - 1) return null;
  if (daysBack === 1 && place === held - 2) return "draft";
  if (daysBack === 2 && place === 0) return "corrected";
  return "announced";
}

/**
 * The made-up counts of the week before a day: one for each sample
 * activity that took place on each of the seven days before it, of the
 * residents it was for, in every stage, and one activity left uncounted.
 * `day` is today on campus.
 */
export function sampleDormCounts(
  day: string,
  activities: KeptSampleActivity[],
  residents: SampleResident[],
): SampleCount[] {
  const counts: SampleCount[] = [];
  for (let daysBack = DAYS_COUNTED; daysBack >= 1; daysBack--) {
    const counted = daysAfter(day, -daysBack);
    const held = heldOn(activities, counted);
    for (const [place, { activityId, version }] of held.entries()) {
      const stage = stageOf(daysBack, place, held.length);
      if (stage === null) continue;
      const participants = residents.filter((resident) =>
        covers(version.audience, resident.dorm),
      );
      const marks = marksOf(participants, daysBack * 5 + place * 3);
      counts.push({
        activityId,
        day: counted,
        endTime: version.endTime,
        stage,
        marks: stage === "corrected" ? correctedOf(marks) : marks,
        firstMarks: stage === "corrected" ? beforeCorrection(marks) : null,
      });
    }
  }
  return counts;
}
