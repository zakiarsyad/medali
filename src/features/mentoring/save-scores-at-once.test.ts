// Sample NIMs of this file: 9962001200 to 9962001299.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveScores, scoresChanged } from "./save-scores";
import type { ScoresInput } from "./score-input";
import { addTestPeriod, type TestPeriod } from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";
import { testScoreLogOf, testScoresOf } from "./test-scores";

/*
 * Two saves at the same moment need two connections that both see the
 * saved score, and the log of scores cannot be emptied. So these checks
 * have a database of their own, dropped at the end, and each uses a group
 * of its own.
 */
const own = withOwnTestDatabase("nilai");

interface Records {
  mentor: AccountForAccess;
  groupId: string;
  memberId: string;
  period: TestPeriod;
}

let period: TestPeriod | undefined;

/** A group with one member and its mentor. `place` tells the groups apart. */
async function addRecords(place: number): Promise<Records> {
  period ??= await addTestPeriod(own.db, 2079);
  const program = await addTestProgram(own.db, `UJINILAISEKALIGUS-${place}`);
  const mentor = await addTestAccount(
    own.db,
    `Pengasuh Nilai Sekaligus ${place}`,
    ["mentor"],
  );
  const memberId = await addTestStudent(own.db, program, {
    nim: `996200120${place}`,
    name: `Anak Asuh Nilai Sekaligus ${place}`,
  });
  const groupId = await addTestGroup(own.db, program, {
    number: 1,
    memberIds: [memberId],
    mentorId: mentor.id,
  });
  return { mentor, groupId, memberId, period };
}

/** Six indicator scores, by the final score they give. */
const SIX: Record<number, number[]> = {
  60: [3, 3, 3, 3, 3, 3],
  70: [4, 4, 3, 3, 4, 3],
  80: [4, 4, 4, 4, 4, 4],
  86.7: [5, 5, 4, 4, 4, 4],
};

function sixOf(final: number): number[] {
  const six = SIX[final];
  if (!six) throw new Error("No six scores give this final score here.");
  return six;
}

/** The six scores that give `final` for the member, from a form opened on `openedOn`. */
function scoreOf(
  records: Records,
  final: number,
  openedOn: number | null,
): ScoresInput {
  return {
    groupId: records.groupId,
    scores: { [records.memberId]: sixOf(final) },
    basedOn: {
      [records.memberId]: openedOn === null ? "" : sixOf(openedOn).join(","),
    },
  };
}

describe("Simpan nilai sent twice at the same moment", () => {
  it("keeps one score for two windows that give a first score: the second waits, then is told the score changed", async () => {
    const records = await addRecords(1);
    const { mentor, memberId } = records;
    const day = records.period.day;

    const both = await own.atOnce(
      (db) => saveScores(db, mentor, scoreOf(records, 80, null), day),
      (db) => saveScores(db, mentor, scoreOf(records, 60, null), day),
    );

    expect(both.sooner).toEqual({ ok: true, value: { savedIds: [memberId] } });
    expect(both.later).toEqual(scoresChanged([memberId]));
    expect(await testScoresOf(own.db, memberId)).toEqual([
      expect.objectContaining({ score: 80 }),
    ]);
    expect(await testScoreLogOf(own.db, memberId)).toHaveLength(1);
  });

  it("keeps the score of the first of two windows that change one saved score, and tells the second the score changed", async () => {
    const records = await addRecords(2);
    const { mentor, memberId } = records;
    const day = records.period.day;
    await saveScores(own.db, mentor, scoreOf(records, 70, null), day);

    const both = await own.atOnce(
      (db) => saveScores(db, mentor, scoreOf(records, 86.7, 70), day),
      (db) => saveScores(db, mentor, scoreOf(records, 60, 70), day),
    );

    expect(both.sooner).toEqual({ ok: true, value: { savedIds: [memberId] } });
    expect(both.later).toEqual(scoresChanged([memberId]));
    expect(await testScoresOf(own.db, memberId)).toEqual([
      expect.objectContaining({ score: 86.7 }),
    ]);
    expect(await testScoreLogOf(own.db, memberId)).toHaveLength(2);
  });
});
