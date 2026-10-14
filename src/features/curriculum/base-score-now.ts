import { cache } from "react";
import { database } from "@/db/database";
import { readBaseScore } from "./stored-base-score";

/** Nilai dasar SIKU as it is now, read once for each request. */
export const baseScoreNow = cache(async (): Promise<number> => {
  const { score } = await readBaseScore(database());
  return score;
});
