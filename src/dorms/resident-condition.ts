import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import { students } from "@/db/schema";
import type { DormId } from "./dorms";

function inFirstYear(dormCohorts: number[]): SQL | undefined {
  if (dormCohorts.length === 0) return sql`false`;
  return and(
    eq(students.entryPath, "regular"),
    inArray(students.cohortYear, dormCohorts),
  );
}

/**
 * The dorm a student row lives in, worked out by the database for a read
 * of many students: the same answer as `dormOf`, which a check confirms.
 * Null for a student who lives in no dorm or is removed. The angkatan
 * years given are those in a semester that lives in the dorm.
 */
export function dormInSql(dormCohorts: number[]): SQL<DormId | null> {
  return sql<DormId | null>`(case
    when ${students.deletedAt} is not null then null
    when ${students.status} <> 'active' then null
    when ${students.isInternational} or ${students.isSeedling} then
      case when ${students.sex} = 'male'
        then 'wismantara_putra' else 'wismantara_putri' end
    when ${inFirstYear(dormCohorts)} then
      case when ${students.sex} = 'male'
        then 'cipta_bakti' else 'dana_rakca' end
    else null
  end)::dorm`;
}

/** The students who live in one dorm, for the `where` of a read. */
export function livesIn(dorm: DormId, dormCohorts: number[]): SQL {
  return sql`${dormInSql(dormCohorts)} = ${dorm}`;
}
