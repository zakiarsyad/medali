import { and, eq } from "drizzle-orm";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { accounts, disciplinePenalties, students } from "@/db/schema";
import { HAS_AGENCY } from "@/discipline-penalties/has-agency";
import type {
  PenaltyCategory,
  PenaltyLevel,
} from "@/discipline-penalties/penalty-kinds";
import type {
  ContinuationCondition,
  ContinuationDecision,
  PenaltyStatus,
  SocialWorkForm,
  SocialWorkPlace,
} from "./penalty-ids";
import { semesterOnDay } from "./penalty-semester";

/** One penalty with all that "Rincian" shows. */
export interface OpenedPenalty {
  id: string;
  /** The student's name, for the questions asked before a follow-up. */
  name: string;
  description: string;
  category: PenaltyCategory;
  level: PenaltyLevel;
  status: PenaltyStatus;
  decisionNumber: string;
  socialWorkForms: SocialWorkForm[];
  socialWorkOther: string;
  socialWorkPlace: SocialWorkPlace | null;
  socialWorkStartsOn: string | null;
  socialWorkEndsOn: string | null;
  savedByName: string;
  /** The student's semester on the Tanggal pelanggaran; null when it falls in no academic period. */
  semester: number | null;
  conditionsMet: ContinuationCondition[];
  decision: ContinuationDecision;
  version: number;
  /** Whether the student has an Instansi asal now, for Syarat melanjutkan studi. */
  hasAgency: boolean;
}

/**
 * "Rincian" of one penalty, of a student the account may see by its
 * right to read discipline records, as the list limits them. Null,
 * reading nothing, for an account without that right or a key that is
 * none; null too for a penalty that does not exist or is outside the
 * account's rows, so the answer never tells which.
 */
export async function readPenaltyDetail(
  db: Database,
  actor: AccountForAccess,
  penaltyId: string,
): Promise<OpenedPenalty | null> {
  if (!may(actor.roles, "view_discipline_records")) return null;
  if (!isUuid(penaltyId)) return null;
  const seen = visibleTo(rowLimitForAction(actor, "view_discipline_records"));
  const [found] = await db
    .select({
      id: disciplinePenalties.id,
      name: students.name,
      cohortYear: students.cohortYear,
      day: disciplinePenalties.day,
      description: disciplinePenalties.description,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
      status: disciplinePenalties.status,
      decisionNumber: disciplinePenalties.decisionNumber,
      socialWorkForms: disciplinePenalties.socialWorkForms,
      socialWorkOther: disciplinePenalties.socialWorkOther,
      socialWorkPlace: disciplinePenalties.socialWorkPlace,
      socialWorkStartsOn: disciplinePenalties.socialWorkStartsOn,
      socialWorkEndsOn: disciplinePenalties.socialWorkEndsOn,
      savedByName: accounts.name,
      conditionsMet: disciplinePenalties.conditionsMet,
      decision: disciplinePenalties.decision,
      version: disciplinePenalties.version,
      hasAgency: HAS_AGENCY,
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .innerJoin(accounts, eq(accounts.id, disciplinePenalties.savedBy))
    .where(and(eq(disciplinePenalties.id, penaltyId), seen));
  if (!found) return null;
  const { cohortYear, day, ...penalty } = found;
  const periods = await readAcademicPeriods(db);
  return { ...penalty, semester: semesterOnDay(cohortYear, periods, day) };
}
