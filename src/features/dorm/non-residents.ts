import { and, asc, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { dormInSql } from "@/dorms/resident-condition";
import { NON_RESIDENTS_SHOWN } from "./room-limits";
import { matchesSearch } from "./room-list";

/** A student the form "Tambah penghuni" offers. */
export interface NonResident {
  id: string;
  name: string;
  nim: string;
  sex: (typeof students.$inferSelect)["sex"];
}

export interface NonResidents {
  /** The first students who live in no dorm, by name. */
  shown: NonResident[];
  /** How many of them match the search in all. */
  matching: number;
}

/** Which students a read is about. */
export interface NonResidentScope {
  /** The angkatan years in a semester that lives in the dorm. */
  dormCohorts: number[];
  /** The student rows the account may see, as a condition. */
  visible: SQL;
}

/**
 * The active students who live in no dorm ("Non asrama") whose name or
 * NIM holds the search text: the first of them by name, and how many
 * there are.
 */
export async function listNonResidents(
  db: Database,
  scope: NonResidentScope,
  query: string,
): Promise<NonResidents> {
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      sex: students.sex,
      matching: sql<number>`count(*) over ()`,
    })
    .from(students)
    .where(
      and(
        scope.visible,
        eq(students.status, "active"),
        isNull(dormInSql(scope.dormCohorts)),
        matchesSearch(query),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(NON_RESIDENTS_SHOWN);
  return {
    shown: rows.map(({ id, name, nim, sex }) => ({ id, name, nim, sex })),
    matching: Number(rows[0]?.matching ?? 0),
  };
}
