import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { dormCompanions, students } from "@/db/schema";
import type { DormId } from "./dorms";

/** A name of its own, so a read that joins the duties too is not confused. */
const DUTY_NAME = "active_duty";
const duty = alias(dormCompanions, DUTY_NAME);

/**
 * The dorm a student row serves as an Aktif kakak pendamping, or null.
 * Found by the key of the duty, which is the student.
 */
const ACTIVE_DUTY_DORM = sql`(select ${duty.dorm}
  from ${dormCompanions} as ${sql.identifier(DUTY_NAME)}
  where ${duty.studentId} = ${students.id} and ${duty.isActive})`;

function inFirstYear(dormCohorts: number[]): SQL | undefined {
  if (dormCohorts.length === 0) return sql`false`;
  return and(
    eq(students.entryPath, "regular"),
    inArray(students.cohortYear, dormCohorts),
  );
}

/** The dorm of the usual rule for an active student row, as text. */
function usualDorm(dormCohorts: number[]): SQL {
  return sql`(case
    when ${students.isInternational} or ${students.isSeedling} then
      case when ${students.sex} = 'male'
        then 'wismantara_putra' else 'wismantara_putri' end
    when ${inFirstYear(dormCohorts)} then
      case when ${students.sex} = 'male'
        then 'cipta_bakti' else 'dana_rakca' end
    else null
  end)::dorm`;
}

function ofActiveStudent(dorm: SQL): SQL<DormId | null> {
  return sql<DormId | null>`(case
    when ${students.deletedAt} is not null then null
    when ${students.status} <> 'active' then null
    else ${dorm}
  end)`;
}

/**
 * The dorm a student row lives in, worked out by the database for a read
 * of many students: the same answer as `dormOf`, which a check confirms.
 * An Aktif kakak pendamping lives in the dorm they serve. Null for a
 * student who lives in no dorm or is removed. The angkatan years given
 * are those in a semester that lives in the dorm.
 */
export function dormInSql(dormCohorts: number[]): SQL<DormId | null> {
  return ofActiveStudent(
    sql`coalesce(${ACTIVE_DUTY_DORM}, ${usualDorm(dormCohorts)})`,
  );
}

/**
 * The dorm a student row lives in by the usual rule, as if they were no
 * kakak pendamping: whether they may be named one is decided by it.
 */
export function usualDormInSql(dormCohorts: number[]): SQL<DormId | null> {
  return ofActiveStudent(usualDorm(dormCohorts));
}

/**
 * The dorm whose rooms a student row takes a place in as a resident. An
 * Aktif kakak pendamping takes none: they have the room of their duty.
 */
export function roomDormInSql(dormCohorts: number[]): SQL<DormId | null> {
  return sql<DormId | null>`(case
    when ${ACTIVE_DUTY_DORM} is not null then null
    else ${usualDormInSql(dormCohorts)}
  end)`;
}

/** The students who live in one dorm, for the `where` of a read. */
export function livesIn(dorm: DormId, dormCohorts: number[]): SQL {
  return sql`${dormInSql(dormCohorts)} = ${dorm}`;
}

/**
 * The residents of one dorm who take a place in its rooms: all but its
 * kakak pendamping. For the `where` of a read.
 */
export function takesRoomIn(dorm: DormId, dormCohorts: number[]): SQL {
  return sql`${roomDormInSql(dormCohorts)} = ${dorm}`;
}
