import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { disciplinePenalties, students } from "@/db/schema";
import { opensDetailOf } from "@/mentoring/opens-detail";
import { type MenteePenalty, PENALTIES_SHOWN } from "./mentee-recap";
import type { MenteeScope } from "./mentee-scope";

/**
 * "Pelanggaran disiplin" of Dashboard anak asuh: the latest discipline
 * penalties of the anak asuh, of those Pembinaan > Pelanggaran disiplin
 * shows the Pengasuh, newest first as that list has them. None for an
 * account that may read none.
 */
export async function readMenteePenalties(
  db: Database,
  scope: MenteeScope,
): Promise<MenteePenalty[]> {
  if (scope.penalties === null) return [];
  return db
    .select({
      id: disciplinePenalties.id,
      studentId: students.id,
      name: students.name,
      opensDetail: opensDetailOf(scope.detail),
      day: disciplinePenalties.day,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
      description: disciplinePenalties.description,
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(and(scope.mentees, scope.penalties))
    .orderBy(
      desc(disciplinePenalties.day),
      desc(disciplinePenalties.savedAt),
      desc(disciplinePenalties.id),
    )
    .limit(PENALTIES_SHOWN);
}
