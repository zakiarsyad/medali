import { daysAfter } from "@/academic-periods/days-after";
import {
  ruleOf,
  socialWorkEnd,
  statusOf,
} from "@/features/guidance/penalty-rules";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_DISCIPLINE_PENALTIES,
  type SampleDisciplinePenalty,
} from "./sample-discipline-penalties";
import { disciplinePenalties, disciplinePenaltyChanges } from "./schema";
import { studentOf } from "./seed-counselling-consents";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

/** The Tanggal pelanggaran of a sample penalty, by today at the latest. */
function samplePenaltyDay(
  penalty: SampleDisciplinePenalty,
  periods: SamplePeriod[],
  today: string,
): string {
  const period = periods[penalty.semester];
  if (!period) throw new Error("There is no sample period for a penalty.");
  if (penalty.semester === 1) return daysAfter(period.startsOn, penalty.days);
  const day = daysAfter(today, -penalty.days);
  return day < period.startsOn ? period.startsOn : day;
}

/** The kerja sosial columns of a sample penalty, by its Jenjang. */
function socialWorkOf(penalty: SampleDisciplinePenalty, day: string) {
  const length = ruleOf(penalty.category, penalty.level).socialWork;
  const work = penalty.socialWork;
  if (length === null || work === null) {
    return {
      socialWorkForms: [],
      socialWorkOther: "",
      socialWorkPlace: null,
      socialWorkStartsOn: null,
      socialWorkEndsOn: null,
    };
  }
  const start = daysAfter(day, work.startsAfter);
  return {
    socialWorkForms: work.forms,
    socialWorkOther: work.other,
    socialWorkPlace: work.place,
    socialWorkStartsOn: start,
    socialWorkEndsOn: socialWorkEnd(start, length),
  };
}

/**
 * Adds the sample discipline penalties, each with the log line of its
 * save, as the work of the sample Pembina Disiplin Mahasiswa or Kepala
 * Unit. The sample students, accounts and periods, newest first, must be
 * there already. `today` is today on campus.
 */
export async function addSampleDisciplinePenalties(
  db: Database,
  periods: SamplePeriod[],
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const writers = {
    discipline_officer: await sampleAccountOf(db, "discipline_officer"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const penalty of SAMPLE_DISCIPLINE_PENALTIES) {
    const student = await studentOf(db, penalty.nim);
    const day = samplePenaltyDay(penalty, periods, today);
    const savedBy = writers[penalty.savedAs];
    const savedAt = momentOf(day, now);
    const id = crypto.randomUUID();
    const { description, category, level, decisionNumber } = penalty;
    await db.insert(disciplinePenalties).values({
      id,
      studentId: student.id,
      day,
      description,
      category,
      level,
      status: statusOf(ruleOf(category, level)),
      decisionNumber,
      ...socialWorkOf(penalty, day),
      savedBy,
      savedAt,
    });
    await db.insert(disciplinePenaltyChanges).values({
      penaltyId: id,
      changedBy: savedBy,
      changedAt: savedAt,
      action: "added",
    });
  }
}
