import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  mentorSurveyResults,
  studentSurveyPeriods,
  surveyResultFixings,
} from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import type { SurveyGroupRow } from "./survey-group-list";
import { readSurveyGroupRows } from "./survey-group-reads";
import { isFixable, readResultPeriods } from "./survey-result-periods";
import { mayResultsBeFixedBy } from "./survey-rights";

export const NOT_ALLOWED_TO_FIX = {
  ok: false,
  error:
    "Hanya Kepala Unit Pembangunan Karakter yang dapat menetapkan hasil evaluasi.",
} as const;

/** What a request is told for a period that runs, is cancelled, or is none. */
export const NOT_FIXABLE = {
  ok: false,
  error:
    "Hasil evaluasi hanya dapat ditetapkan setelah periode ditutup atau berakhir. Muat ulang halaman, lalu periksa lagi.",
} as const;

export const ALREADY_FIXED = {
  ok: false,
  error:
    "Hasil evaluasi periode ini sudah ditetapkan. Muat ulang halaman untuk melihatnya.",
} as const;

/** The database's own rule: a period is fixed once. */
const ONCE_PER_PERIOD = "survey_result_fixings_once_per_period";

/** What "Tetapkan hasil evaluasi" tells the one who fixed. */
export interface FixedResults {
  /** How many lines went into the evaluation history. */
  lines: number;
}

type NewLine = typeof mentorSurveyResults.$inferInsert;

/**
 * The line a row gets in the evaluation history, or null for a row
 * without Nilai evaluasi: fewer than 3 answers, no Capaian karakter, or no
 * mentor its answers count for.
 */
export function lineOf(row: SurveyGroupRow, fixingId: string): NewLine | null {
  const { achievement, feedback, score } = row.result;
  if (row.mentorId === null) return null;
  if (achievement === null || feedback === null || score === null) return null;
  return {
    fixingId,
    groupId: row.group.id,
    mentorId: row.mentorId,
    respondents: row.result.answers,
    members: row.result.members,
    achievement,
    feedback,
    score,
  };
}

/**
 * Holds the survey period until the transaction ends, so of two requests
 * at the same moment the second waits and then finds it fixed.
 */
async function lockPeriod(tx: Database, id: string): Promise<boolean> {
  const [found] = await tx
    .select({ id: studentSurveyPeriods.id })
    .from(studentSurveyPeriods)
    .where(eq(studentSurveyPeriods.id, id))
    .for("update");
  return found !== undefined;
}

/**
 * Adds the fixing in a step of its own, which alone is undone when the
 * database refuses it. Null when the period is fixed already.
 */
async function addFixing(
  tx: Database,
  actorId: string,
  surveyPeriodId: string,
): Promise<string | null> {
  try {
    const [added] = await tx.transaction((step) =>
      step
        .insert(surveyResultFixings)
        .values({ surveyPeriodId, fixedBy: actorId, fixedAt: WRITTEN_NOW })
        .returning({ id: surveyResultFixings.id }),
    );
    if (!added) throw new Error("The fixing was not added.");
    return added.id;
  } catch (error) {
    if (brokeUniqueRule(error, ONCE_PER_PERIOD)) return null;
    throw error;
  }
}

/**
 * "Tetapkan hasil evaluasi": fixes the results of a survey period that is
 * Ditutup or Berakhir into the mentors' evaluation history, as the work of
 * the actor: one line for each group and mentor with a Nilai evaluasi,
 * with how many of its members answered. Refused for any role but Kepala
 * Unit, for a period that runs, is cancelled or is none, and for one that
 * is fixed already: all of it read here, never taken from the browser.
 */
export async function fixSurveyResults(
  db: Database,
  actor: AccountForAccess,
  surveyPeriodId: string,
  today: string = campusDay(),
): Promise<Parsed<FixedResults>> {
  if (!mayResultsBeFixedBy(actor)) return NOT_ALLOWED_TO_FIX;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(surveyPeriodId)) return NOT_FIXABLE;
  return db.transaction(async (tx) => {
    if (!(await lockPeriod(tx, surveyPeriodId))) return NOT_FIXABLE;
    const periods = await readResultPeriods(tx, today);
    const period = periods.find((one) => one.id === surveyPeriodId);
    if (!period) return NOT_FIXABLE;
    if (period.fixed !== null) return ALREADY_FIXED;
    if (!isFixable(period)) return NOT_FIXABLE;
    const fixingId = await addFixing(tx, actor.id, surveyPeriodId);
    if (fixingId === null) return ALREADY_FIXED;
    const limit = rowLimitForAction(actor, "fix_survey_results");
    const rows = await readSurveyGroupRows(tx, limit, period);
    const lines: NewLine[] = [];
    for (const row of rows) {
      const line = lineOf(row, fixingId);
      if (line !== null) lines.push(line);
    }
    if (lines.length > 0) await tx.insert(mentorSurveyResults).values(lines);
    return { ok: true, value: { lines: lines.length } };
  });
}
