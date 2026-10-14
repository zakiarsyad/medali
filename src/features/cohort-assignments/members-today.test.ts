import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listCohorts } from "./cohort-list";
import { readAssignment } from "./stored-assignment";
import { addFixedTestDraft, addTestDraft, testGroupsOf } from "./test-drafts";
import { placeTestMember, testLiveIdOf } from "./test-live-groups";
import { addTestStudents, onlyProgram } from "./test-records";
import { EVERY_ROW } from "./visible-assignments";

const inTestDatabase = withTestDatabase();

const YEAR = 2067;
const FIRST_NIM = 9967000001;
const LATE_NIM = 9967000201;

/**
 * A fixed penetapan of 60 students in two groups of one program studi
 * and 20 in one group of another, with the kelompok each group became.
 */
async function addFixed(db: Database) {
  const draft = await addFixedTestDraft(db, YEAR, FIRST_NIM, "UJIKINI");
  const [first, second] = await testGroupsOf(db, YEAR, draft.large);
  const [small] = await testGroupsOf(db, YEAR, draft.small);
  if (!first || !second || !small) throw new Error("No group was fixed.");
  return {
    ...draft,
    first,
    second,
    smallGroup: small,
    firstLive: await testLiveIdOf(db, first.id),
    secondLive: await testLiveIdOf(db, second.id),
  };
}

/** The NIMs of the members the tab reads for each group, by group id. */
async function shownNims(db: Database, limit = EVERY_ROW) {
  const shown = await readAssignment(db, limit, YEAR);
  const nims = new Map<string, string[]>();
  for (const group of shown?.groups ?? []) {
    nims.set(
      group.id,
      group.members.map((member) => member.nim),
    );
  }
  return nims;
}

describe("the members of a fixed penetapan", () => {
  it("lists and counts a late student in the group they were put into", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixed(db);
      const [late] = await addTestStudents(db, fixed.large, 1, LATE_NIM, {
        cohortYear: YEAR,
      });
      await placeTestMember(db, late ?? "", fixed.firstLive);

      const nims = await shownNims(db);
      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(nims.get(fixed.first.id)).toHaveLength(31);
      expect(nims.get(fixed.first.id)).toContain(String(LATE_NIM));
      expect(cohorts).toContainEqual(
        expect.objectContaining({ cohortYear: YEAR, students: 81 }),
      );
    });
  });

  it("lists a moved student in the group they are in now, and no more in the one they left", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixed(db);
      const moved = fixed.first.members[0];
      if (!moved) throw new Error("The group has no member.");
      await placeTestMember(db, moved.id, fixed.secondLive);

      const nims = await shownNims(db);

      expect(nims.get(fixed.first.id)).toHaveLength(29);
      expect(nims.get(fixed.first.id)).not.toContain(moved.nim);
      expect(nims.get(fixed.second.id)).toHaveLength(31);
      expect(nims.get(fixed.second.id)).toContain(moved.nim);
    });
  });

  it("lists and counts no student who was taken out of their group", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixed(db);
      const out = fixed.first.members[0];
      if (!out) throw new Error("The group has no member.");
      await placeTestMember(db, out.id, null);

      const nims = await shownNims(db);
      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(nims.get(fixed.first.id)).toHaveLength(29);
      expect(nims.get(fixed.first.id)).not.toContain(out.nim);
      expect(cohorts).toContainEqual(
        expect.objectContaining({ cohortYear: YEAR, students: 79 }),
      );
    });
  });

  it("lists and counts no member who is on Cuti, as for a draft", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixed(db);
      const onLeave = fixed.first.members[0];
      if (!onLeave) throw new Error("The group has no member.");
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, onLeave.id));

      const nims = await shownNims(db);
      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(nims.get(fixed.first.id)).toHaveLength(29);
      expect(cohorts).toContainEqual(
        expect.objectContaining({ cohortYear: YEAR, students: 79 }),
      );
    });
  });

  it("gives a head of a study program the members of today of that program only", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixed(db);
      const [late] = await addTestStudents(db, fixed.large, 1, LATE_NIM, {
        cohortYear: YEAR,
      });
      await placeTestMember(db, late ?? "", fixed.firstLive);

      const ownNims = await shownNims(db, onlyProgram(fixed.large));
      const otherNims = await shownNims(db, onlyProgram(fixed.small));
      const own = await listCohorts(db, onlyProgram(fixed.large));
      const other = await listCohorts(db, onlyProgram(fixed.small));

      expect([...ownNims.keys()]).toEqual([fixed.first.id, fixed.second.id]);
      expect(ownNims.get(fixed.first.id)).toHaveLength(31);
      expect([...otherNims.keys()]).toEqual([fixed.smallGroup.id]);
      expect(otherNims.get(fixed.smallGroup.id)).toHaveLength(20);
      expect(own).toMatchObject([{ cohortYear: YEAR, students: 61 }]);
      expect(other).toMatchObject([{ cohortYear: YEAR, students: 20 }]);
    });
  });
});

describe("the members of a penetapan that is not fixed", () => {
  it("are those prepared for each group", async () => {
    await inTestDatabase(async (db) => {
      const draft = await addTestDraft(db, YEAR, FIRST_NIM, "UJIKINI");
      const [first] = await testGroupsOf(db, YEAR, draft.large);

      const cohorts = await listCohorts(db, EVERY_ROW);

      expect(first?.members).toHaveLength(30);
      expect(cohorts).toContainEqual(
        expect.objectContaining({ cohortYear: YEAR, status: "draft" }),
      );
    });
  });
});
