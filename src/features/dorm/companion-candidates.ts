import { and, asc, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCompanions, students } from "@/db/schema";
import { dormInSql } from "@/dorms/resident-condition";
import { CANDIDATES_SHOWN } from "./companion-limits";
import { matchesSearch } from "./room-list";

/** A student who can be named kakak pendamping, as the form offers them. */
export interface Candidate {
  id: string;
  name: string;
  nim: string;
  sex: (typeof students.$inferSelect)["sex"];
}

export interface Candidates {
  /** The first students who can be named, by name. */
  shown: Candidate[];
  /** How many students who can be named match the search in all. */
  matching: number;
}

/** Which students a read is about. */
export interface CandidateScope {
  /** The angkatan years in a semester that lives in the dorm. */
  dormCohorts: number[];
  /** The student rows the account may see, as a condition. */
  visible: SQL;
}

/**
 * The students who can be named kakak pendamping whose name or NIM holds
 * the search text: active, living in no dorm, and not kakak pendamping
 * already, whether active or stopped. The first of them by name, and how
 * many there are.
 */
export async function listCandidates(
  db: Database,
  scope: CandidateScope,
  query: string,
): Promise<Candidates> {
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      sex: students.sex,
      matching: sql<number>`count(*) over ()`,
    })
    .from(students)
    .leftJoin(dormCompanions, eq(dormCompanions.studentId, students.id))
    .where(
      and(
        scope.visible,
        eq(students.status, "active"),
        sql`${dormInSql(scope.dormCohorts)} is null`,
        isNull(dormCompanions.studentId),
        matchesSearch(query),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(CANDIDATES_SHOWN);
  return {
    shown: rows.map(({ id, name, nim, sex }) => ({ id, name, nim, sex })),
    matching: Number(rows[0]?.matching ?? 0),
  };
}
