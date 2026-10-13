import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { testMentorLinesOf } from "@/mentoring/test-replacements";
import type { ReplacementInput } from "./replacement-input";
import { NOT_A_SPARE_MENTOR } from "./replacement-refusals";
import { saveReplacement } from "./save-replacement";
import { addTestEvaluator, addTestHeldGroup } from "./test-evaluations";
import { addTestMentor, addTestMentorRole } from "./test-records";

/*
 * A replacement is never erased, so no rows are removed after the check:
 * the database is dropped at the end.
 */
const own = withOwnTestDatabase("penggantian");

const TODAY = "2084-10-13";

async function addSpare(db: Database, name: string): Promise<string> {
  const id = await addTestMentor(db, { name });
  await addTestMentorRole(db, id);
  return id;
}

function inputFor(groupId: string, newMentorId: string): ReplacementInput {
  return {
    groupId,
    reason: "own_request",
    startsOn: TODAY,
    newMentorId,
    letterNumber: "ND-12/PKN/2084",
    oldMentorStatus: "reserve",
    note: null,
  };
}

describe("one spare mentor chosen for two groups at the same moment", () => {
  it("gets the first group only: the second save waits, then finds the mentor is no spare mentor any more", async () => {
    const first = await addTestHeldGroup(own.db, "UJIGANTIDUAA", "Lama A");
    const second = await addTestHeldGroup(own.db, "UJIGANTIDUAB", "Lama B");
    const spare = await addSpare(own.db, "Pengasuh Uji Rebutan");
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);

    const both = await own.atOnce(
      (db) => saveReplacement(db, head, inputFor(first.groupId, spare), TODAY),
      (db) => saveReplacement(db, head, inputFor(second.groupId, spare), TODAY),
    );

    expect(both.sooner).toMatchObject({ ok: true, value: { isInForce: true } });
    expect(both.later).toEqual(NOT_A_SPARE_MENTOR);
    expect(await testMentorLinesOf(own.db, first.groupId)).toHaveLength(2);
    expect(await testMentorLinesOf(own.db, second.groupId)).toHaveLength(1);
  });
});
