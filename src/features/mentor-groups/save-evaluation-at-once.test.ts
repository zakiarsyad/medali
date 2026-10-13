import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { EvaluationInput } from "./evaluation-input";
import { saveEvaluation } from "./save-evaluation";
import {
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
  TEST_SCORES,
  testEvaluationsOf,
  testLogOf,
} from "./test-evaluations";

/*
 * The log of evaluations cannot be emptied, so no rows are removed after
 * the check: the database is dropped at the end.
 */
const own = withOwnTestDatabase("evaluasi");

describe("Simpan evaluasi pressed twice at the same moment", () => {
  it("saves one evaluation with one log line: the second waits, then finds nothing to change", async () => {
    const group = await addTestHeldGroup(own.db, "UJIDUAKALI", "Pengasuh Dua");
    const periods = await addTestPeriods(own.db, 2085);
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);
    const input: EvaluationInput = {
      groupId: group.groupId,
      periodId: periods.runningId,
      scores: TEST_SCORES,
      note: "Rutin mendampingi.",
    };

    const both = await own.atOnce(
      (db) => saveEvaluation(db, head, input, periods.day),
      (db) => saveEvaluation(db, head, input, periods.day),
    );

    const saved = {
      ok: true,
      value: { mentorName: "Pengasuh Dua", result: "fair" },
    };
    expect(both.sooner).toEqual(saved);
    expect(both.later).toEqual(saved);
    expect(await testEvaluationsOf(own.db, group.groupId)).toHaveLength(1);
    expect(await testLogOf(own.db, group.groupId)).toHaveLength(1);
  });
});
