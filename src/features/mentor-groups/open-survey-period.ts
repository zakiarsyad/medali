import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { studentSurveyPeriods } from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import { WRITTEN_NOW } from "@/db/written-now";
import {
  ONE_RUNNING_SURVEY_RULE,
  readRunningSurveyPeriod,
} from "@/mentoring/running-survey-period";
import type { Parsed } from "@/parsed";
import { evaluationPeriods } from "./evaluation-periods";
import { ASK_FOR_PERIOD, type SurveyPeriodInput } from "./survey-input";
import { maySurveyBeManagedBy } from "./survey-rights";

/** What every change of a survey period answers to any role but Kepala Unit. */
export const NOT_ALLOWED_TO_MANAGE = {
  ok: false,
  error: "Anda tidak berhak mengelola periode evaluasi oleh mahasiswa.",
} as const;

export const ALREADY_RUNNING = {
  ok: false,
  error:
    "Masih ada periode evaluasi yang terjadwal atau dibuka. Tutup atau batalkan periode itu dulu, lalu buka periode baru.",
} as const;

const PERIOD_NOT_OFFERED = { ok: false, error: ASK_FOR_PERIOD } as const;

/** What "Buka periode evaluasi" opened, for the message that says so. */
export interface OpenedSurveyPeriod {
  /** The Periode as the screens name it, such as Ganjil 2026/2027. */
  title: string;
  startsOn: string;
}

/**
 * Adds the period in a step of its own, which alone is undone when the
 * database refuses it. False when its own rule did: another period was
 * opened after the look that found none running.
 */
async function addSurveyPeriod(
  db: Database,
  actorId: string,
  input: SurveyPeriodInput,
): Promise<boolean> {
  const values = { ...input, openedBy: actorId, openedAt: WRITTEN_NOW };
  try {
    await db.transaction((step) =>
      step.insert(studentSurveyPeriods).values(values),
    );
    return true;
  } catch (error) {
    if (brokeUniqueRule(error, ONE_RUNNING_SURVEY_RULE)) return false;
    throw error;
  }
}

/**
 * "Buka periode evaluasi": keeps a new survey period as the work of the
 * actor. Refused for any role but Kepala Unit, for a Periode that is
 * neither the running academic period of `today` nor the one before it,
 * and while another survey period is Terjadwal or Dibuka: all of it read
 * here, never taken from the browser. Two that arrive at the same moment
 * open one: the database makes the second wait and then refuses it.
 */
export async function openSurveyPeriod(
  db: Database,
  actor: AccountForAccess,
  input: SurveyPeriodInput,
  today: string = campusDay(),
): Promise<Parsed<OpenedSurveyPeriod>> {
  if (!maySurveyBeManagedBy(actor)) return NOT_ALLOWED_TO_MANAGE;
  const [periods, running] = await Promise.all([
    readAcademicPeriods(db),
    readRunningSurveyPeriod(db, today),
  ]);
  const offered = evaluationPeriods(periods, today);
  const period = offered.find((each) => each.id === input.periodId);
  if (!period) return PERIOD_NOT_OFFERED;
  if (running !== null) return ALREADY_RUNNING;
  if (!(await addSurveyPeriod(db, actor.id, input))) return ALREADY_RUNNING;
  return {
    ok: true,
    value: { title: periodTitle(period), startsOn: input.startsOn },
  };
}
