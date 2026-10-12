import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { chooseMentor } from "./choose-mentor";
import { DRAFT_CHANGED, NOT_ALLOWED } from "./refusals";
import {
  addTestDraft,
  fixTestDraft,
  testDraftOf,
  testGroupsOf,
} from "./test-drafts";
import {
  addTestActor,
  addTestLiveGroup,
  addTestMentor,
  addTestMentorOfToday,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2049;
const FIRST_NIM = 9949000001;
const KEY = { cohortYear: YEAR, version: 1 };

/** A draft, its first group and a mentor that may be chosen for it. */
async function addDraftAndMentor(db: Database) {
  const draft = await addTestDraft(db, YEAR, FIRST_NIM, "UJIPENGASUH");
  const [group] = await testGroupsOf(db, YEAR, draft.large);
  if (!group) throw new Error("The draft has no group.");
  const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Pilihan" });
  return { ...draft, groupId: group.id, mentorId };
}

async function mentorNames(db: Database): Promise<(string | null)[]> {
  const draft = await testDraftOf(db, YEAR);
  return draft.groups.map((group) => group.mentor?.name ?? null);
}

describe("chooseMentor", () => {
  it("saves the mentor of the group, with one more version and a line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, mentorId } = await addDraftAndMentor(db);
      const head = await addTestActor(db, ["head_of_unit"], "Kepala Uji Pilih");

      const chosen = await chooseMentor(db, head, {
        ...KEY,
        groupId,
        mentorId,
      });

      expect(chosen).toEqual({ ok: true, value: null });
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({
        status: "draft",
        version: 2,
        savedBy: "Kepala Uji Pilih",
      });
      const saved = draft.groups.find((group) => group.id === groupId);
      expect(saved?.mentor).toMatchObject({ id: mentorId });
      expect(draft.log.map((line) => [line.action, line.by])).toEqual(
        expect.arrayContaining([
          ["draft_saved", "Kepala Uji Pilih"],
          ["groups_formed", "Pegawai UJIPENGASUH"],
        ]),
      );
      expect(draft.log).toHaveLength(2);
    });
  });

  it("takes the mentor off a group for an empty choice", async () => {
    await inTestDatabase(async (db) => {
      const { actor, groupId, mentorId } = await addDraftAndMentor(db);
      await chooseMentor(db, actor, { ...KEY, groupId, mentorId });

      const emptied = await chooseMentor(db, actor, {
        cohortYear: YEAR,
        version: 2,
        groupId,
        mentorId: null,
      });

      expect(emptied.ok).toBe(true);
      expect(await mentorNames(db)).toEqual([null, null, null]);
    });
  });

  it("saves one mentor for two groups, which the note then names", async () => {
    await inTestDatabase(async (db) => {
      const { actor, large, mentorId } = await addDraftAndMentor(db);
      const [first, second] = await testGroupsOf(db, YEAR, large);
      await chooseMentor(db, actor, {
        ...KEY,
        groupId: first?.id ?? "",
        mentorId,
      });

      const twice = await chooseMentor(db, actor, {
        cohortYear: YEAR,
        version: 2,
        groupId: second?.id ?? "",
        mentorId,
      });

      expect(twice.ok).toBe(true);
      const names = await mentorNames(db);
      expect(
        names.filter((name) => name === "Pengasuh Uji Pilihan"),
      ).toHaveLength(2);
    });
  });

  it("keeps a submitted draft submitted, and makes a cancelled one a draft again", async () => {
    await inTestDatabase(async (db) => {
      const { actor, groupId, mentorId } = await addDraftAndMentor(db);
      const ofYear = eq(cohortAssignments.cohortYear, YEAR);
      await db
        .update(cohortAssignments)
        .set({ status: "submitted" })
        .where(ofYear);

      await chooseMentor(db, actor, { ...KEY, groupId, mentorId });
      expect(await testDraftOf(db, YEAR)).toMatchObject({
        status: "submitted",
      });

      await db
        .update(cohortAssignments)
        .set({ status: "cancelled" })
        .where(ofYear);
      await chooseMentor(db, actor, {
        cohortYear: YEAR,
        version: 2,
        groupId,
        mentorId: null,
      });
      expect(await testDraftOf(db, YEAR)).toMatchObject({ status: "draft" });
    });
  });

  it("refuses a mentor who holds a group of another angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { actor, groupId, large } = await addDraftAndMentor(db);
      const busy = await addTestMentor(db, { name: "Pengasuh Uji Sibuk" });
      const live = await addTestLiveGroup(db, large, { cohortYear: YEAR - 1 });
      await addTestMentorOfToday(db, live, busy);

      const chosen = await chooseMentor(db, actor, {
        ...KEY,
        groupId,
        mentorId: busy,
      });

      expect(chosen.ok).toBe(false);
      expect(await testDraftOf(db, YEAR)).toMatchObject({ version: 1 });
      expect(await mentorNames(db)).toEqual([null, null, null]);
    });
  });

  it("refuses an account that is no mentor", async () => {
    await inTestDatabase(async (db) => {
      const { actor, groupId } = await addDraftAndMentor(db);

      const chosen = await chooseMentor(db, actor, {
        ...KEY,
        groupId,
        mentorId: actor.id,
      });

      expect(chosen.ok).toBe(false);
      expect(await mentorNames(db)).toEqual([null, null, null]);
    });
  });

  it("refuses a group that is not of the draft, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { actor, mentorId } = await addDraftAndMentor(db);

      const chosen = await chooseMentor(db, actor, {
        ...KEY,
        groupId: "11111111-1111-4111-8111-111111111111",
        mentorId,
      });

      expect(chosen.ok).toBe(false);
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ version: 1 });
      expect(draft.log).toHaveLength(1);
    });
  });

  it("refuses a choice made from an older draft", async () => {
    await inTestDatabase(async (db) => {
      const { actor, groupId, mentorId } = await addDraftAndMentor(db);
      await chooseMentor(db, actor, { ...KEY, groupId, mentorId });

      const stale = await chooseMentor(db, actor, {
        ...KEY,
        groupId,
        mentorId: null,
      });

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(await testDraftOf(db, YEAR)).toMatchObject({ version: 2 });
    });
  });

  it("refuses a fixed angkatan, and one without groups", async () => {
    await inTestDatabase(async (db) => {
      const { actor, groupId, mentorId } = await addDraftAndMentor(db);
      const choice = { ...KEY, groupId, mentorId };

      const unformed = await chooseMentor(db, actor, {
        ...choice,
        cohortYear: YEAR + 20,
      });
      await fixTestDraft(db, YEAR);
      const fixed = await chooseMentor(db, actor, choice);

      expect(unformed.ok).toBe(false);
      expect(fixed.ok).toBe(false);
      expect(await mentorNames(db)).toEqual([null, null, null]);
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor", "student"])(
    "refuses %s, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { groupId, mentorId } = await addDraftAndMentor(db);
        const other = await addTestActor(db, [role], "Akun Uji Ditolak");

        const chosen = await chooseMentor(db, other, {
          ...KEY,
          groupId,
          mentorId,
        });

        expect(chosen).toEqual(NOT_ALLOWED);
        const draft = await testDraftOf(db, YEAR);
        expect(draft).toMatchObject({ version: 1 });
        expect(draft.log).toHaveLength(1);
      });
    },
  );
});
