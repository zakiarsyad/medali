import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { disciplinePenalties, students } from "@/db/schema";
import { HAS_AGENCY } from "./has-agency";
import { type HeavyPenalty, type Sanction, sanctionOf } from "./sanction";

interface StudentHeavyPenalties {
  penalties: HeavyPenalty[];
  hasAgency: boolean;
}

/** The Berat penalties of the students, each student's latest first. */
async function readHeavyPenalties(
  db: Database,
  reach: SQL,
  ids: string[],
): Promise<Map<string, StudentHeavyPenalties>> {
  const rows = await db
    .select({
      studentId: disciplinePenalties.studentId,
      level: disciplinePenalties.level,
      status: disciplinePenalties.status,
      decision: disciplinePenalties.decision,
      hasAgency: HAS_AGENCY.mapWith(Boolean),
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(
      and(
        inArray(disciplinePenalties.studentId, ids),
        eq(disciplinePenalties.category, "heavy"),
        reach,
      ),
    )
    .orderBy(
      desc(disciplinePenalties.day),
      desc(disciplinePenalties.savedAt),
      desc(disciplinePenalties.id),
    );
  const byStudent = new Map<string, StudentHeavyPenalties>();
  for (const { studentId, hasAgency, ...penalty } of rows) {
    const found = byStudent.get(studentId) ?? { penalties: [], hasAgency };
    found.penalties.push(penalty);
    byStudent.set(studentId, found);
  }
  return byStudent;
}

/**
 * The badge beside the status of each of these students who has one,
 * read once for all of them. Nothing for an account that may not read
 * discipline records, and nothing for a student outside the rows it
 * reads them in.
 */
export async function readSanctions(
  db: Database,
  actor: AccountForAccess,
  ids: readonly string[],
): Promise<Map<string, Sanction>> {
  const sanctions = new Map<string, Sanction>();
  if (!may(actor.roles, "view_discipline_records")) return sanctions;
  // The database refuses to compare its ids with a text of another shape.
  const asked = ids.filter(isUuid);
  if (asked.length === 0) return sanctions;
  const reach = visibleTo(rowLimitForAction(actor, "view_discipline_records"));
  const heavy = await readHeavyPenalties(db, reach, asked);
  for (const [studentId, { penalties, hasAgency }] of heavy) {
    const sanction = sanctionOf(penalties, hasAgency);
    if (sanction !== null) sanctions.set(studentId, sanction);
  }
  return sanctions;
}
