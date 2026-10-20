import { and, eq, lte } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { studentSurveyAnswers, studentSurveyPeriods } from "@/db/schema";
import { surveyRunsOn } from "@/mentoring/running-survey-period";
import type { Parsed } from "@/parsed";
import { checkSurveyAnswer } from "./own-survey-rules";
import { readSurveyMentor } from "./survey-mentor";

/** What "Kirim survei" sends. Nothing of it is trusted. */
export interface SentSurveyAnswer {
  surveyPeriodId: unknown;
  /** The mentor named on the form, whom the answer rates. */
  mentorId: unknown;
  scores: unknown;
  suggestion: unknown;
}

/** The fields of what was sent: none of something that is no object. */
function fieldsOf(sent: unknown): Partial<SentSurveyAnswer> {
  if (typeof sent !== "object" || sent === null) return {};
  return sent;
}

export const NOT_ALLOWED_TO_ANSWER = {
  ok: false,
  error: "Anda tidak dapat mengisi survei kepuasan pengasuhan.",
} as const;

export const SURVEY_CLOSED = {
  ok: false,
  error: "Periode evaluasi sudah ditutup.",
} as const;

export const MENTOR_CHANGED = {
  ok: false,
  error: "Pengasuh Anda sudah berganti. Muat ulang halaman, lalu kirim lagi.",
} as const;

/**
 * Whether the period is Dibuka on a day. It is locked until the answer
 * is kept, so a close or a cancel at the same moment waits for it, and
 * an answer that comes after them finds the period closed.
 */
async function lockOpenPeriod(
  tx: Database,
  id: string,
  today: string,
): Promise<boolean> {
  const [open] = await tx
    .select({ id: studentSurveyPeriods.id })
    .from(studentSurveyPeriods)
    .where(
      and(
        eq(studentSurveyPeriods.id, id),
        surveyRunsOn(today),
        lte(studentSurveyPeriods.startsOn, today),
      ),
    )
    .for("share");
  return open !== undefined;
}

/**
 * "Kirim survei" of the signed-in student, for themselves only: their
 * answer of the period, kept or changed, one per student and period, the
 * latest kept. It counts for the student's group and mentor of today.
 * Refused, saving nothing, for a statement left unanswered, a score
 * outside 1 to 5, a period that is not Dibuka, a mentor who is not the
 * student's, a student who is not Aktif or has no pengasuh, and any role
 * without the right.
 */
export async function sendOwnSurvey(
  db: Database,
  actor: AccountForAccess,
  sentFromBrowser: unknown,
  now: Date = new Date(),
): Promise<Parsed<{ sentAt: Date }>> {
  if (!may(actor.roles, "answer_own_survey")) return NOT_ALLOWED_TO_ANSWER;
  const { studentId } = actor;
  if (studentId === null) return NOT_ALLOWED_TO_ANSWER;
  const sent = fieldsOf(sentFromBrowser);
  const scores = Array.isArray(sent.scores) ? sent.scores : [];
  const checked = checkSurveyAnswer(scores, sent.suggestion);
  if (!checked.ok) return checked;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(sent.surveyPeriodId)) return SURVEY_CLOSED;
  const surveyPeriodId = sent.surveyPeriodId as string;
  return db.transaction(async (tx) => {
    if (!(await lockOpenPeriod(tx, surveyPeriodId, campusDay(now)))) {
      return SURVEY_CLOSED;
    }
    const mentor = await readSurveyMentor(tx, studentId);
    if (mentor === null) return NOT_ALLOWED_TO_ANSWER;
    if (mentor.mentorId !== sent.mentorId) return MENTOR_CHANGED;
    const answer = {
      groupId: mentor.groupId,
      mentorId: mentor.mentorId,
      ...checked.value,
      sentAt: now,
    };
    await tx
      .insert(studentSurveyAnswers)
      .values({ surveyPeriodId, studentId, ...answer })
      .onConflictDoUpdate({
        target: [
          studentSurveyAnswers.surveyPeriodId,
          studentSurveyAnswers.studentId,
        ],
        set: answer,
      });
    return { ok: true, value: { sentAt: now } };
  });
}
