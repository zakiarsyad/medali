import { count, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  cohortAssignments,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { droppedWords } from "./dropped-members";
import { fixAssignment } from "./fix-assignment";
import { saveDecree } from "./save-decree";
import { addCompleteTestDraft, testDraftOf } from "./test-drafts";
import { testLiveGroupsOf } from "./test-live-groups";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2054;
const FIRST_NIM = 9954000001;
/** A complete draft stands at version 2: formed, then its mentors filled. */
const INPUT = {
  cohortYear: YEAR,
  version: 2,
  decreeNumber: "KEP-54/UJI/2054",
  effectiveOn: "2054-09-01",
};

/**
 * A complete draft of 80 students of which one was removed and two went
 * on Cuti after it was saved, with the Kepala Unit who saves next.
 */
async function addDraftWithGoneMembers(db: Database) {
  await addCompleteTestDraft(db, YEAR, FIRST_NIM, "UJIKELUAR");
  const head = await addTestActor(db, ["head_of_unit"], "Kepala Uji Keluar");
  const [group] = (await testDraftOf(db, YEAR)).groups;
  const [removed, ...onLeave] =
    group?.members.slice(0, 3).map((member) => member.id) ?? [];
  await db
    .update(students)
    .set({ deletedAt: new Date(), deletedBy: head.id })
    .where(eq(students.id, removed ?? ""));
  await db
    .update(students)
    .set({ status: "on_leave" })
    .where(inArray(students.id, onLeave));
  return { head, gone: [removed, ...onLeave] };
}

/** How many students the stored groups of the draft name. */
async function storedMembers(db: Database): Promise<number> {
  const [stored] = await db
    .select({ members: count() })
    .from(cohortAssignmentMembers)
    .innerJoin(
      cohortAssignmentGroups,
      eq(cohortAssignmentGroups.id, cohortAssignmentMembers.groupId),
    )
    .innerJoin(
      cohortAssignments,
      eq(cohortAssignments.id, cohortAssignmentGroups.assignmentId),
    )
    .where(eq(cohortAssignments.cohortYear, YEAR));
  return stored?.members ?? 0;
}

describe("droppedWords", () => {
  it("says how many students left the draft and why, and names nobody", () => {
    expect(droppedWords(3)).toBe(
      "3 mahasiswa dikeluarkan dari draf karena sudah dihapus atau tidak aktif lagi.",
    );
  });
});

describe("a draft that names a student who was removed or is not Aktif any more", () => {
  it("is read without that student, counted as dropped, and the read writes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { gone } = await addDraftWithGoneMembers(db);

      const draft = await testDraftOf(db, YEAR);

      expect(draft.dropped).toBe(3);
      const shown = draft.groups.flatMap((group) => group.members);
      expect(shown).toHaveLength(77);
      for (const id of gone) {
        expect(shown.map((member) => member.id)).not.toContain(id);
      }
      expect(await storedMembers(db)).toBe(80);
      expect(draft).toMatchObject({ version: 2 });
      expect(draft.log.map((line) => line.action)).not.toContain(
        "members_dropped",
      );
    });
  });

  it("loses that student at the next save, with a line of its own in the log", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftWithGoneMembers(db);

      const saved = await saveDecree(db, head, INPUT);

      expect(saved.ok).toBe(true);
      expect(await storedMembers(db)).toBe(77);
      const draft = await testDraftOf(db, YEAR);
      expect(draft.dropped).toBe(0);
      expect(
        draft.log.slice(0, 2).map((line) => [line.action, line.by]),
      ).toEqual([
        ["draft_saved", "Kepala Uji Keluar"],
        ["members_dropped", "Kepala Uji Keluar"],
      ]);
    });
  });

  it("keeps every stored student and adds no line when the save is refused", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftWithGoneMembers(db);

      const stale = await saveDecree(db, head, { ...INPUT, version: 1 });

      expect(stale.ok).toBe(false);
      expect(await storedMembers(db)).toBe(80);
      expect((await testDraftOf(db, YEAR)).log).toHaveLength(2);
    });
  });

  it("is fixed without that student, who gets no kelompok", async () => {
    await inTestDatabase(async (db) => {
      const { head, gone } = await addDraftWithGoneMembers(db);

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed).toEqual({ ok: true, value: null });
      const live = await testLiveGroupsOf(db, YEAR);
      const placed = live.flatMap((group) => group.studentIds);
      expect(placed).toHaveLength(77);
      for (const id of gone) expect(placed).not.toContain(id);
      const actions = (await testDraftOf(db, YEAR)).log.map((l) => l.action);
      expect(actions.slice(0, 2)).toEqual(["fixed", "members_dropped"]);
    });
  });

  it("adds no line of its own to a save of a draft that lost nobody", async () => {
    await inTestDatabase(async (db) => {
      await addCompleteTestDraft(db, YEAR, FIRST_NIM, "UJIKELUAR");
      const head = await addTestActor(db, ["head_of_unit"]);

      await saveDecree(db, head, INPUT);

      const actions = (await testDraftOf(db, YEAR)).log.map((l) => l.action);
      expect(actions).not.toContain("members_dropped");
    });
  });
});
