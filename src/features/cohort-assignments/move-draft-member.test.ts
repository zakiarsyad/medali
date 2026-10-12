import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { moveDraftMember } from "./move-draft-member";
import { DRAFT_CHANGED, NOT_ALLOWED } from "./refusals";
import {
  addTestDraft,
  fixTestDraft,
  testDraftOf,
  testGroupsOf,
} from "./test-drafts";
import { addTestActor, addTestProgram, addTestStudents } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2051;
const KEY = { cohortYear: YEAR, version: 1 };

/** A draft with a student of its first group and the groups to move to. */
async function addDraftToMoveIn(db: Database) {
  const draft = await addTestDraft(db, YEAR, "UJIPINDAH");
  const [from, sameProgram] = await testGroupsOf(db, YEAR, draft.large);
  const [otherProgram] = await testGroupsOf(db, YEAR, draft.small);
  const studentId = from?.members[0]?.id;
  if (!from || !sameProgram || !otherProgram || !studentId) {
    throw new Error("The draft has not the groups the check needs.");
  }
  return { ...draft, from, sameProgram, otherProgram, studentId };
}

/** How many members each group holds, in the order of the tab. */
async function sizes(db: Database): Promise<number[]> {
  const draft = await testDraftOf(db, YEAR);
  return draft.groups.map((group) => group.members.length);
}

describe("moveDraftMember", () => {
  it("moves a student to another group of the same program studi and jalur, with a line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { large, sameProgram, studentId } = await addDraftToMoveIn(db);
      const head = await addTestActor(
        db,
        ["head_of_unit"],
        "Kepala Uji Pindah",
      );

      const moved = await moveDraftMember(db, head, {
        ...KEY,
        studentId,
        toGroupId: sameProgram.id,
      });

      expect(moved).toEqual({ ok: true, value: null });
      const [first, second] = await testGroupsOf(db, YEAR, large);
      expect(first?.members).toHaveLength(29);
      expect(second?.members).toHaveLength(31);
      expect(second?.members.map((member) => member.id)).toContain(studentId);
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ version: 2, savedBy: "Kepala Uji Pindah" });
      expect(draft.log.map((line) => [line.action, line.by])).toContainEqual([
        "draft_saved",
        "Kepala Uji Pindah",
      ]);
    });
  });

  it("refuses a group of another program studi, and moves nobody", async () => {
    await inTestDatabase(async (db) => {
      const { actor, otherProgram, studentId } = await addDraftToMoveIn(db);

      const moved = await moveDraftMember(db, actor, {
        ...KEY,
        studentId,
        toGroupId: otherProgram.id,
      });

      expect(moved.ok).toBe(false);
      expect(await sizes(db)).toEqual([20, 30, 30]);
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ version: 1 });
      expect(draft.log).toHaveLength(1);
    });
  });

  it("refuses the group the student is in, and a group that is not of the draft", async () => {
    await inTestDatabase(async (db) => {
      const { actor, from, studentId } = await addDraftToMoveIn(db);

      const same = await moveDraftMember(db, actor, {
        ...KEY,
        studentId,
        toGroupId: from.id,
      });
      const unknown = await moveDraftMember(db, actor, {
        ...KEY,
        studentId,
        toGroupId: "11111111-1111-4111-8111-111111111111",
      });

      expect(same.ok).toBe(false);
      expect(unknown.ok).toBe(false);
      expect(await sizes(db)).toEqual([20, 30, 30]);
    });
  });

  it("refuses a student who is not in the draft", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sameProgram } = await addDraftToMoveIn(db);
      const elsewhere = await addTestProgram(db, "UJIPINDAH Lain");
      const [outsider] = await addTestStudents(db, elsewhere, 1, 9951000901, {
        cohortYear: YEAR,
      });

      const moved = await moveDraftMember(db, actor, {
        ...KEY,
        studentId: outsider ?? "",
        toGroupId: sameProgram.id,
      });

      expect(moved.ok).toBe(false);
      expect(await sizes(db)).toEqual([20, 30, 30]);
    });
  });

  it("refuses a move made from an older draft, and a fixed angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sameProgram, studentId } = await addDraftToMoveIn(db);
      const move = { ...KEY, studentId, toGroupId: sameProgram.id };

      const stale = await moveDraftMember(db, actor, { ...move, version: 0 });
      await fixTestDraft(db, YEAR);
      const fixed = await moveDraftMember(db, actor, move);

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(fixed.ok).toBe(false);
      expect(await sizes(db)).toEqual([20, 30, 30]);
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor"])(
    "refuses %s, and moves nobody",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { sameProgram, studentId } = await addDraftToMoveIn(db);
        const other = await addTestActor(db, [role], "Akun Uji Ditolak");

        const moved = await moveDraftMember(db, other, {
          ...KEY,
          studentId,
          toGroupId: sameProgram.id,
        });

        expect(moved).toEqual(NOT_ALLOWED);
        expect(await sizes(db)).toEqual([20, 30, 30]);
      });
    },
  );
});
