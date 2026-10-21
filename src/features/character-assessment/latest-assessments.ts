import { eq, inArray } from "drizzle-orm";
import {
  rerataFromTotal,
  type Scores,
} from "@/character-scores/assessment-score";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import {
  accounts,
  type characterAssessments,
  characterAssessmentUploads,
} from "@/db/schema";
import type { AssessmentSource } from "./assessment-ids";

type StoredScores = Pick<
  typeof characterAssessments.$inferSelect,
  "scoreM" | "scoreE" | "scoreD" | "scoreA" | "scoreL" | "scoreI"
>;

/** The scores of a stored assessment, by MEDALI value. */
export function scoresOf(row: StoredScores): Scores {
  return {
    M: row.scoreM,
    E: row.scoreE,
    D: row.scoreD,
    A: row.scoreA,
    L: row.scoreL,
    I: row.scoreI,
  };
}

/** A student's latest assessment, as the screens show it. */
export interface LatestAssessment {
  enteredAt: Date;
  source: AssessmentSource;
  /** The name of the file it was uploaded in, or null for the form. */
  fileName: string | null;
  /** The name of the account that entered it. */
  enteredBy: string;
  /** The scores as every screen shows them: at most 70 under a Ringan or Sedang penalty. */
  scores: Scores;
  /** Rerata of the scores as stored, before any limit. */
  storedRerata: number;
}

/** The latest assessment of each of some students that has one. */
export async function readLatestOf(
  db: Database,
  studentIds: string[],
): Promise<Map<string, LatestAssessment>> {
  const found = new Map<string, LatestAssessment>();
  if (studentIds.length === 0) return found;
  const latest = latestAssessments(db);
  const rows = await db
    .select({
      studentId: latest.studentId,
      enteredAt: latest.enteredAt,
      source: latest.source,
      fileName: characterAssessmentUploads.fileName,
      enteredBy: accounts.name,
      scoreM: latest.scoreM,
      scoreE: latest.scoreE,
      scoreD: latest.scoreD,
      scoreA: latest.scoreA,
      scoreL: latest.scoreL,
      scoreI: latest.scoreI,
      storedTotal: latest.storedTotal,
    })
    .from(latest)
    .innerJoin(accounts, eq(accounts.id, latest.enteredBy))
    .leftJoin(
      characterAssessmentUploads,
      eq(characterAssessmentUploads.id, latest.uploadId),
    )
    .where(inArray(latest.studentId, studentIds));
  for (const row of rows) {
    const { studentId, enteredAt, source, fileName, enteredBy, storedTotal } =
      row;
    found.set(studentId, {
      enteredAt,
      source,
      fileName,
      enteredBy,
      scores: scoresOf(row),
      storedRerata: rerataFromTotal(storedTotal),
    });
  }
  return found;
}
