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

type FollowUpLine = Omit<
  typeof disciplinePenaltyChanges.$inferInsert,
  "penaltyId" | "changedBy"
>;

/**
 * The log lines of how a sample penalty was followed up: its status
 * moved on from Dijatuhkan the day after the Tanggal, and its conditions
 * ticked the day after that, each by now at the latest.
 */
function followUpLinesOf(
  penalty: SampleDisciplinePenalty,
  day: string,
  now: Date,
): FollowUpLine[] {
  const lines: FollowUpLine[] = [];
  const conditionsAfter = penalty.conditionsMet ?? [];
  const statusAfter = penalty.movedTo ?? "imposed";
  const unchanged = {
    decisionBefore: "pending",
    decisionAfter: "pending",
  } as const;
  if (penalty.movedTo !== undefined) {
    lines.push({
      changedAt: momentOf(daysAfter(day, 1), now),
      action: "status_changed",
      statusBefore: "imposed",
      statusAfter,
      conditionsBefore: [],
      conditionsAfter: [],
      ...unchanged,
    });
  }
  if (conditionsAfter.length > 0) {
    lines.push({
      changedAt: momentOf(daysAfter(day, 2), now),
      action: "conditions_changed",
      statusBefore: statusAfter,
      statusAfter,
      conditionsBefore: [],
      conditionsAfter,
      ...unchanged,
    });
  }
  return lines;
}

/**
 * Adds the sample discipline penalties, each with the log line of its
 * save and those of its follow-ups, as the work of the sample Pembina
 * Disiplin Mahasiswa or Kepala Unit. The sample students, accounts and
 * periods, newest first, must be there already. `today` is today on
 * campus.
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
    const followUps = followUpLinesOf(penalty, day, now);
    await db.insert(disciplinePenalties).values({
      id,
      studentId: student.id,
      day,
      description,
      category,
      level,
      status: penalty.movedTo ?? statusOf(ruleOf(category, level)),
      decisionNumber,
      ...socialWorkOf(penalty, day),
      conditionsMet: penalty.conditionsMet ?? [],
      version: 1 + followUps.length,
      savedBy,
      savedAt,
    });
    const lines = [
      { changedAt: savedAt, action: "added" as const },
      ...followUps,
    ];
    await db
      .insert(disciplinePenaltyChanges)
      .values(
        lines.map((line) => ({ ...line, penaltyId: id, changedBy: savedBy })),
      );
  }
}
