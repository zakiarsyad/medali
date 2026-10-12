import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { fixAssignment } from "./fix-assignment";
import { ALREADY_FIXED } from "./refusals";
import { addCompleteTestDraft, testDraftOf } from "./test-drafts";
import { testLiveGroupsOf } from "./test-live-groups";
import { addTestActor } from "./test-records";

/*
 * The log of a penetapan cannot be emptied, so no rows are removed after
 * the check: it uses an angkatan of its own, and the database is dropped
 * at the end.
 */
const own = withOwnTestDatabase("penetapan");

const YEAR = 2053;
const INPUT = {
  cohortYear: YEAR,
  version: 2,
  decreeNumber: "KEP-53/UJI/2053",
  effectiveOn: "2053-09-01",
};

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
