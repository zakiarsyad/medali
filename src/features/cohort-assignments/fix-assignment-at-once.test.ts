import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { chooseMentor } from "./choose-mentor";
import { fixAssignment } from "./fix-assignment";
import { ALREADY_FIXED } from "./refusals";
import { addCompleteTestDraft, addTestDraft, testDraftOf } from "./test-drafts";
import { testLiveGroupsOf } from "./test-live-groups";
import { addTestActor } from "./test-records";

/*
 * The log of a penetapan cannot be emptied, so no rows are removed after
 * the check: each one uses angkatan of its own, and the database is
 * dropped at the end.
 */
const own = withOwnTestDatabase("penetapan");

const YEAR = 2053;
const INPUT = {
  cohortYear: YEAR,
  version: 2,
  decreeNumber: "KEP-53/UJI/2053",
  effectiveOn: "2053-09-01",
};

const OTHER_YEAR = 2056;

/**
 * A draft of another angkatan whose three groups have the mentors of the
 * three groups of a complete draft. Each choice raises its version by 1.
 */
async function addDraftWithMentorsOf(db: Database, cohortYear: number) {
  const { actor } = await addTestDraft(db, OTHER_YEAR, "UJIDUAANGKATAN");
  const taken = (await testDraftOf(db, cohortYear)).groups;
  const groups = (await testDraftOf(db, OTHER_YEAR)).groups;
  let version = 1;
  for (const [place, group] of groups.entries()) {
    const chosen = await chooseMentor(db, actor, {
      cohortYear: OTHER_YEAR,
      version,
      groupId: group.id,
      mentorId: taken[place]?.mentor?.id ?? null,
    });
    if (!chosen.ok) throw new Error(chosen.error);
    version += 1;
  }
  return version;
}

describe("two people who fix one penetapan at the same moment", () => {
  it("fixes it once: the second waits, is refused, and adds no group", async () => {
    await addCompleteTestDraft(own.db, YEAR, "UJISERENTAK");
    const head = await addTestActor(own.db, ["head_of_unit"], "Kepala Satu");
    const other = await addTestActor(own.db, ["head_of_unit"], "Kepala Dua");

    const both = await own.atOnce(
      (db) => fixAssignment(db, head, INPUT),
      (db) => fixAssignment(db, other, INPUT),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(ALREADY_FIXED);
    expect(await testLiveGroupsOf(own.db, YEAR)).toHaveLength(3);
    const fixed = await testDraftOf(own.db, YEAR);
    expect(fixed).toMatchObject({ status: "fixed", savedBy: "Kepala Satu" });
    const fixes = fixed.log.filter((line) => line.action === "fixed");
    expect(fixes).toHaveLength(1);
  });
});

describe("two angkatan with the same mentors that are fixed at the same moment", () => {
  it("fixes the first: the second waits, is refused, and gives no mentor a group of two angkatan", async () => {
    const year = 2055;
    await addCompleteTestDraft(own.db, year, "UJIDUA");
    const version = await addDraftWithMentorsOf(own.db, year);
    const head = await addTestActor(own.db, ["head_of_unit"], "Kepala Tiga");
    const decree = {
      decreeNumber: "KEP-55/UJI/2055",
      effectiveOn: INPUT.effectiveOn,
    };

    const both = await own.atOnce(
      (db) =>
        fixAssignment(db, head, { cohortYear: year, version: 2, ...decree }),
      (db) =>
        fixAssignment(db, head, { cohortYear: OTHER_YEAR, version, ...decree }),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toMatchObject({
      ok: false,
      error: expect.stringContaining("3 pengasuh pada draf"),
    });
    expect(await testLiveGroupsOf(own.db, year)).toHaveLength(3);
    expect(await testLiveGroupsOf(own.db, OTHER_YEAR)).toHaveLength(0);
    expect(await testDraftOf(own.db, OTHER_YEAR)).toMatchObject({
      status: "draft",
    });
  });
});
