import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  testMentorLinesOf,
  testReplacementsOf,
} from "@/mentoring/test-replacements";
import type { ReplacementInput } from "./replacement-input";
import {
  alreadyScheduled,
  MENTOR_CHANGED,
  NOT_A_SPARE_MENTOR,
} from "./replacement-refusals";
import { saveReplacement } from "./save-replacement";
import {
  addTestEvaluator,
  addTestHeldGroup,
  type TestHeldGroup,
} from "./test-evaluations";
import { addTestMentor, addTestMentorRole } from "./test-records";

/*
 * A replacement is never erased, so no rows are removed after the check:
 * the database is dropped at the end.
 */
const own = withOwnTestDatabase("penggantian");

const TODAY = "2084-10-13";
const LATER = "2084-11-02";

async function addSpare(db: Database, name: string): Promise<string> {
  const id = await addTestMentor(db, { name });
  await addTestMentorRole(db, id);
  return id;
}

function inputFor(held: TestHeldGroup, newMentorId: string): ReplacementInput {
  return {
    groupId: held.groupId,
    oldMentorId: held.mentorId,
    reason: "own_request",
    startsOn: TODAY,
    newMentorId,
    letterNumber: "ND-12/PKN/2084",
    oldMentorStatus: "reserve",
    note: null,
  };
}

describe("Tetapkan penggantian pressed twice at the same moment", () => {
  it("schedules one replacement for a later date: the second save waits, then is told the group has one already", async () => {
    const held = await addTestHeldGroup(
      own.db,
      "UJIGANTITEKANA",
      "Lama Tekan A",
    );
    const spare = await addSpare(own.db, "Pengasuh Uji Tekan A");
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);
    const input = { ...inputFor(held, spare), startsOn: LATER };

    const both = await own.atOnce(
      (db) => saveReplacement(db, head, input, TODAY),
      (db) => saveReplacement(db, head, input, TODAY),
    );

    expect(both.sooner).toMatchObject({
      ok: true,
      value: { isInForce: false },
    });
    expect(both.later).toEqual(alreadyScheduled(LATER));
    expect(await testReplacementsOf(own.db, held.groupId)).toHaveLength(1);
    expect(await testMentorLinesOf(own.db, held.groupId)).toHaveLength(1);
  });

  it("replaces the mentor once for today: the second save waits, then finds the group has another mentor", async () => {
    const held = await addTestHeldGroup(
      own.db,
      "UJIGANTITEKANB",
      "Lama Tekan B",
    );
    const spare = await addSpare(own.db, "Pengasuh Uji Tekan B");
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);
    const input = inputFor(held, spare);

    const both = await own.atOnce(
      (db) => saveReplacement(db, head, input, TODAY),
      (db) => saveReplacement(db, head, input, TODAY),
    );

    expect(both.sooner).toMatchObject({ ok: true, value: { isInForce: true } });
    expect(both.later).toEqual(MENTOR_CHANGED);
    expect(await testReplacementsOf(own.db, held.groupId)).toHaveLength(1);
    expect(await testMentorLinesOf(own.db, held.groupId)).toHaveLength(2);
  });
});

describe("two spare mentors chosen for one group at the same moment", () => {
  it("replaces the mentor the forms showed once: the second save waits, then finds the group has another mentor", async () => {
    const held = await addTestHeldGroup(own.db, "UJIGANTISATU", "Lama Satu");
    const first = await addSpare(own.db, "Pengasuh Uji Satu A");
    const second = await addSpare(own.db, "Pengasuh Uji Satu B");
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);

    const both = await own.atOnce(
      (db) => saveReplacement(db, head, inputFor(held, first), TODAY),
      (db) => saveReplacement(db, head, inputFor(held, second), TODAY),
    );

    expect(both.sooner).toMatchObject({ ok: true, value: { isInForce: true } });
    expect(both.later).toEqual(MENTOR_CHANGED);
    expect(await testReplacementsOf(own.db, held.groupId)).toHaveLength(1);
    expect(await testMentorLinesOf(own.db, held.groupId)).toHaveLength(2);
  });
});

describe("one spare mentor chosen for two groups at the same moment", () => {
  it("gets the first group only: the second save waits, then finds the mentor is no spare mentor any more", async () => {
    const first = await addTestHeldGroup(own.db, "UJIGANTIDUAA", "Lama A");
    const second = await addTestHeldGroup(own.db, "UJIGANTIDUAB", "Lama B");
    const spare = await addSpare(own.db, "Pengasuh Uji Rebutan");
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);

    const both = await own.atOnce(
      (db) => saveReplacement(db, head, inputFor(first, spare), TODAY),
      (db) => saveReplacement(db, head, inputFor(second, spare), TODAY),
    );

    expect(both.sooner).toMatchObject({ ok: true, value: { isInForce: true } });
    expect(both.later).toEqual(NOT_A_SPARE_MENTOR);
    expect(await testMentorLinesOf(own.db, first.groupId)).toHaveLength(2);
    expect(await testMentorLinesOf(own.db, second.groupId)).toHaveLength(1);
  });
});
