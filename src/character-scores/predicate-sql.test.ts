import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  predicateOf,
  rerataFromTotal,
  SCORE_MAX,
  SCORE_MIN,
} from "./assessment-score";
import { predicateSql } from "./predicate-sql";

const inTestDatabase = withTestDatabase();

describe("predicateSql", () => {
  it("gives every total of six whole scores the predikat the server gives its Rerata", async () => {
    await inTestDatabase(async (db) => {
      const lowest = SCORE_MIN * 6;
      const highest = SCORE_MAX * 6;
      const total = sql`given.total`;
      const rows = await db.execute<{ total: number; predicate: string }>(
        sql`select given.total, ${predicateSql(total)} as predicate from generate_series(${lowest}::integer, ${highest}::integer) as given(total) order by given.total`,
      );

      expect(rows.length).toBe(highest - lowest + 1);
      for (const row of rows) {
        const expected = predicateOf(rerataFromTotal(row.total));
        expect(row.predicate, `total ${row.total}`).toBe(expected);
      }
      const kinds = new Set(rows.map((row) => row.predicate));
      expect(kinds.size).toBe(4);
    });
  });
});
