import { and, count, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import type { ResidentsByDorm } from "./activity-audience";

function isDorm(dorm: string | null): dorm is DormId {
  return DORM_IDS.some((id) => id === dorm);
}

/**
 * How many residents each dorm has today, among the students an account
 * may see: Ketua Program Studi counts those of their program only. While
 * no academic period runs no semester is known, so only Internasional and
 * Pembibitan students count as residents.
 */
export async function countResidentsByDorm(
  db: Database,
  visible: SQL,
  day?: string,
): Promise<ResidentsByDorm> {
  const dormCohorts = (await readDormCohorts(db, day)) ?? [];
  const dorm = dormInSql(dormCohorts);
  const counted = await db
    .select({ dorm, residents: count() })
    .from(students)
    .where(and(visible, sql`${dorm} is not null`))
    // By its place in the list: the rule holds values of its own, so the
    // database would not take it written a second time for the same one.
    .groupBy(sql`1`);

  const residents: ResidentsByDorm = {
    wismantara_putra: 0,
    wismantara_putri: 0,
    dana_rakca: 0,
    cipta_bakti: 0,
  };
  for (const row of counted) {
    if (isDorm(row.dorm)) residents[row.dorm] = row.residents;
  }
  return residents;
}
