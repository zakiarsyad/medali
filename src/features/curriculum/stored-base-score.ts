import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, sikuBaseScore } from "@/db/schema";
import type { Change } from "./change";

/** The SIKU base score until someone sets another. */
export const STARTING_BASE_SCORE = 65;

export interface ShownBaseScore {
  score: number;
  /** The last change, or null while the score is the starting one. */
  changed: Change | null;
}

/** The SIKU base score as it is now, with who set it last. */
export async function readBaseScore(db: Database): Promise<ShownBaseScore> {
  const [saved] = await db
    .select({
      score: sikuBaseScore.score,
      at: sikuBaseScore.setAt,
      by: accounts.name,
    })
    .from(sikuBaseScore)
    .innerJoin(accounts, eq(accounts.id, sikuBaseScore.setBy));
  if (!saved) return { score: STARTING_BASE_SCORE, changed: null };
  return { score: saved.score, changed: { at: saved.at, by: saved.by } };
}
