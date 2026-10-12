import { and, eq, isNull, max } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroups } from "@/db/schema";
import type { FormedGroup } from "./form-groups";

/** The highest number among the groups in force of one program and jalur. */
export interface HighestNumber
  extends Pick<FormedGroup, "studyProgramId" | "entryPath"> {
  highest: number;
}

function highestFor(group: FormedGroup, live: HighestNumber[]): number {
  const found = live.find(
    (one) =>
      one.studyProgramId === group.studyProgramId &&
      one.entryPath === group.entryPath,
  );
  return found?.highest ?? 0;
}

/**
 * Numbers the formed groups after the groups already in force of the same
 * program studi and jalur, so that fixing them never asks for a number
 * that is taken. Without such a group the numbers stay from 1.
 */
export function numberAfterLive(
  groups: FormedGroup[],
  live: HighestNumber[],
): FormedGroup[] {
  return groups.map((group) => ({
    ...group,
    number: group.number + highestFor(group, live),
  }));
}

/** The highest number of each program and jalur among an angkatan's groups in force. */
export async function readHighestNumbers(
  db: Database,
  cohortYear: number,
): Promise<HighestNumber[]> {
  const rows = await db
    .select({
      studyProgramId: mentorGroups.studyProgramId,
      entryPath: mentorGroups.entryPath,
      highest: max(mentorGroups.number),
    })
    .from(mentorGroups)
    .where(
      and(
        eq(mentorGroups.cohortYear, cohortYear),
        isNull(mentorGroups.endedAt),
      ),
    )
    .groupBy(mentorGroups.studyProgramId, mentorGroups.entryPath);
  return rows.map((row) => ({ ...row, highest: row.highest ?? 0 }));
}
