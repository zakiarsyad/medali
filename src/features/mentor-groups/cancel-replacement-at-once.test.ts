import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  addTestReplacement,
  testMentorLinesOf,
  testReplacementsOf,
} from "@/mentoring/test-replacements";
import { ALREADY_CANCELLED, cancelReplacement } from "./cancel-replacement";
import { addTestEvaluator, addTestHeldGroup } from "./test-evaluations";
import { addTestMentor, addTestMentorRole } from "./test-records";

/*
 * A replacement is never erased, so no rows are removed after the check:
 * the database is dropped at the end.
 */
const own = withOwnTestDatabase("batalganti");

describe("Batalkan pressed twice at the same moment", () => {
  it("cancels once: the second cancel waits, then is told the replacement is cancelled already", async () => {
    const held = await addTestHeldGroup(own.db, "UJIBATALDUA", "Lama Batal");
    const newMentorId = await addTestMentor(own.db, { name: "Baru Batal" });
    await addTestMentorRole(own.db, newMentorId);
    const first = await addTestEvaluator(own.db, ["head_of_unit"], "Kepala A");
    const second = await addTestEvaluator(own.db, ["head_of_unit"], "Kepala B");
    const id = await addTestReplacement(own.db, {
      groupId: held.groupId,
      oldMentorId: held.mentorId,
      newMentorId,
      startsOn: "2086-11-02",
    });

    const both = await own.atOnce(
      (db) => cancelReplacement(db, first, id),
      (db) => cancelReplacement(db, second, id),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(ALREADY_CANCELLED);
    const stored = await testReplacementsOf(own.db, held.groupId);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ cancelledBy: first.id });
    expect(await testMentorLinesOf(own.db, held.groupId)).toHaveLength(1);
  });
});
