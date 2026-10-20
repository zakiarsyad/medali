import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { finalRankSql } from "./final-category-sql";
import { categoryOf } from "./fitness-category";
import { STARTING_LIMITS } from "./fitness-ids";
import { finalCategory, SERIOUSNESS } from "./health-category";
import type { NoteCategory } from "./health-ids";

const inTestDatabase = withTestDatabase();

const SCORES = [null, 100, 85, 84, 70, 69, 55, 54, 0];
const NOTES: (NoteCategory | null)[] = [null, "good", "attention", "medical"];

function expectedRank(score: number | null, note: NoteCategory | null) {
  const test = score === null ? null : categoryOf(score, STARTING_LIMITS);
  const { category } = finalCategory(test, note);
  return category === "untested" ? null : SERIOUSNESS[category];
}

describe("finalRankSql", () => {
  it("ranks every score and note as the final-category rule does", async () => {
    await inTestDatabase(async (db) => {
      for (const score of SCORES) {
        for (const note of NOTES) {
          const scoreSql = sql`${score}::integer`;
          const noteSql = sql`${note}::health_note_category`;
          const [row] = await db.execute<{ rank: number | null }>(
            sql`select ${finalRankSql(scoreSql, noteSql, STARTING_LIMITS)} as rank`,
          );
          expect(row?.rank, `${score} ${note}`).toBe(expectedRank(score, note));
        }
      }
    });
  });
});
