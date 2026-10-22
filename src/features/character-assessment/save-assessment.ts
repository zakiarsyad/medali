import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { characterAssessments, students } from "@/db/schema";
import { readLimitsOf } from "@/discipline-penalties/read-limits";
import { isAboveLimit } from "@/discipline-penalties/score-limit";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import { MEDALI_VALUES } from "@/ui/medali-values";
import {
  type AssessmentInput,
  parseAssessment,
  type SentAssessment,
} from "./assessment-input";
import {
  ASSESSMENT_ALREADY_SENT,
  NO_PERIOD,
  NOT_ALLOWED_TO_ASSESS,
  OVER_LIMIT,
  STUDENT_NOT_FOUND,
} from "./assessment-messages";
import { scoresOf } from "./latest-assessments";

type StoredAssessment = typeof characterAssessments.$inferSelect;

/** What "Simpan asesmen" says once the assessment is kept. */
export function savedMessage(name: string): string {
  return `Asesmen ${name} disimpan.`;
}

/**
 * The name of the student when they are Aktif now and the account may
 * assess them, or null.
 */
async function assessedStudentName(
  tx: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<string | null> {
  const scope = visibleTo(rowLimitForAction(actor, "assess_character"));
  const [student] = await tx
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), ACTIVE_MEMBER, scope));
  return student?.name ?? null;
}

/**
 * Whether the assessment kept under a key is the one this form added
 * before: by the same account, with every part the same. A form changed
 * after it was sent is not the same form: taking it for one would drop
 * the change while saying it was saved.
 */
function isSameAssessment(
  kept: StoredAssessment,
  actorId: string,
  input: AssessmentInput,
): boolean {
  const keptScores = scoresOf(kept);
  const sameScores = MEDALI_VALUES.every(
    ({ key }) => keptScores[key] === input.scores[key],
  );
  return (
    sameScores &&
    kept.enteredBy === actorId &&
    kept.studentId === input.studentId &&
    kept.source === input.source &&
    kept.note === input.note
  );
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: AssessmentInput,
  moment: Date,
): Promise<Parsed<string>> {
  const period = await readRunningPeriod(tx, campusDay(moment));
  if (period === null) return NO_PERIOD;
  const name = await assessedStudentName(tx, actor, input.studentId);
  if (name === null) return STUDENT_NOT_FOUND;
  const { scores } = input;
  const limits = await readLimitsOf(tx, [input.studentId]);
  if (limits.has(input.studentId) && isAboveLimit(scores)) return OVER_LIMIT;
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(characterAssessments)
    .values({
      id,
      studentId: input.studentId,
      scoreM: scores.M,
      scoreE: scores.E,
      scoreD: scores.D,
      scoreA: scores.A,
      scoreL: scores.L,
      scoreI: scores.I,
      source: input.source,
      note: input.note,
      periodId: period.id,
      enteredBy: actor.id,
      enteredAt: moment,
    })
    .onConflictDoNothing({ target: characterAssessments.id })
    .returning({ id: characterAssessments.id });
  if (added.length > 0) return { ok: true, value: name };
  const [kept] = await tx
    .select()
    .from(characterAssessments)
    .where(eq(characterAssessments.id, id));
  if (!kept || !isSameAssessment(kept, actor.id, input)) {
    return ASSESSMENT_ALREADY_SENT;
  }
  return { ok: true, value: name };
}

/**
 * "Simpan asesmen": keeps a character assessment of one Aktif student
 * the account may assess, in the academic period that runs on the day
 * it is saved, as the work of the actor. The assessment is its own line
 * in the log: it can never be changed or deleted. Refused, with nothing
 * kept, for a role without the right Asesmen karakter, for what the form
 * rules refuse, while no period runs, for any other student, and for a
 * score above 70 of a student under a Ringan or Sedang penalty. `id`
 * is the key its form made: a form sent twice is kept once, and the
 * second press is answered as the first. Gives the student's name.
 */
export async function saveAssessment(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentAssessment,
  moment: Date = new Date(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "assess_character")) return NOT_ALLOWED_TO_ASSESS;
  const parsed = parseAssessment(sent);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return ASSESSMENT_ALREADY_SENT;
  const input = parsed.value;
  return db.transaction((tx) => save(tx, actor, id, input, moment));
}
