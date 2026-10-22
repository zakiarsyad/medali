import { and, desc, eq, isNotNull, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { disciplinePenalties, students } from "@/db/schema";
import type {
  PenaltyCategory,
  PenaltyLevel,
  PenaltyStatus,
} from "./penalty-ids";

/** One penalty of "Riwayat pelanggaran disiplin" in a student's detail. */
export interface StudentPenalty {
  id: string;
  day: string;
  category: PenaltyCategory;
  level: PenaltyLevel;
  status: PenaltyStatus;
  /** Uraian pelanggaran. */
  description: string;
  /** Whether a kerja sosial was set, as "Daftar pelanggaran" shows it. */
  hasSocialWork: boolean;
}

/**
 * The students whose discipline records the account may read, by the
 * rows of only its roles with that right; null for an account without it.
 */
export function penaltyReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "view_discipline_records")) return null;
  return visibleTo(rowLimitForAction(actor, "view_discipline_records"));
}

/**
 * The students "Daftar pelanggaran" holds for the account: those within
 * its reach who have a penalty. Null for an account without the right.
 */
export function penalisedReachOf(actor: AccountForAccess): SQL | null {
  const reach = penaltyReachOf(actor);
  if (reach === null) return null;
  const kept = disciplinePenalties;
  const penalised = sql`exists (select 1 from ${kept} where ${kept.studentId} = ${students.id})`;
  return and(reach, penalised) ?? reach;
}

/**
 * Every discipline penalty of one student, the latest Tanggal first, read
 * anew on each opening. Null, with nothing read, for an account that may
 * not read discipline records; none for a student outside its rows, the
 * same answer as for a student without a penalty, so a refusal tells
 * nothing.
 */
export async function readStudentPenalties(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<StudentPenalty[] | null> {
  const reach = penaltyReachOf(actor);
  if (reach === null) return null;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return [];
  return db
    .select({
      id: disciplinePenalties.id,
      day: disciplinePenalties.day,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
      status: disciplinePenalties.status,
      description: disciplinePenalties.description,
      hasSocialWork: isNotNull(disciplinePenalties.socialWorkEndsOn).mapWith(
        Boolean,
      ),
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(and(eq(disciplinePenalties.studentId, studentId), reach))
    .orderBy(
      desc(disciplinePenalties.day),
      desc(disciplinePenalties.savedAt),
      desc(disciplinePenalties.id),
    );
}
