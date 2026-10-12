import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { chooseMentor } from "./choose-mentor";
import { fillDraftMentors } from "./fill-draft-mentors";
import { DRAFT_CHANGED, NOT_ALLOWED } from "./refusals";
import { addTestDraft, testDraftOf } from "./test-drafts";
import { addTestActor, addTestMentor } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2050;
const FIRST_NIM = 9950000001;
const KEY = { cohortYear: YEAR, version: 1 };

/** The mentor of each group, in the order of the tab: Akuntansi, Pajak 1 and 2. */
async function mentorNames(db: Database): Promise<(string | null)[]> {
  const draft = await testDraftOf(db, YEAR);
  return draft.groups.map((group) => group.mentor?.name ?? null);
}

describe("fillDraftMentors", () => {
  it("gives every group without a mentor one, the same jurusan first, in one save", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, FIRST_NIM, "UJIISI");
      await addTestMentor(db, { name: "Isi Adi", unit: "Jurusan Pajak" });
      await addTestMentor(db, { name: "Isi Budi", unit: "Jurusan Akuntansi" });
      await addTestMentor(db, { name: "Isi Citra", unit: "Jurusan Pajak" });

      const filled = await fillDraftMentors(db, actor, KEY);

      expect(filled).toEqual({ ok: true, value: 3 });
      expect(await mentorNames(db)).toEqual([
        "Isi Budi",
        "Isi Adi",
        "Isi Citra",
      ]);
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ version: 2 });
      expect(draft.log.map((line) => line.action).sort()).toEqual([
        "draft_saved",
        "groups_formed",
      ]);
    });
  });

  it("keeps a mentor already chosen, and leaves a group empty once nobody is left", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, FIRST_NIM, "UJIISI");
      const adi = await addTestMentor(db, { name: "Isi Adi" });
      await addTestMentor(db, { name: "Isi Budi" });
      const [, , last] = (await testDraftOf(db, YEAR)).groups;
      await chooseMentor(db, actor, {
        ...KEY,
        groupId: last?.id ?? "",
        mentorId: adi,
      });

      const filled = await fillDraftMentors(db, actor, {
        cohortYear: YEAR,
        version: 2,
      });

      expect(filled).toEqual({ ok: true, value: 1 });
      expect(await mentorNames(db)).toEqual(["Isi Budi", null, "Isi Adi"]);
    });
  });

  it("saves nothing when no mentor is left, or no group is empty", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, FIRST_NIM, "UJIISI");

      const nobody = await fillDraftMentors(db, actor, KEY);

      expect(nobody.ok).toBe(false);
      await addTestMentor(db, { name: "Isi Adi" });
      await addTestMentor(db, { name: "Isi Budi" });
      await addTestMentor(db, { name: "Isi Citra" });
      await fillDraftMentors(db, actor, KEY);
      const full = await fillDraftMentors(db, actor, {
        cohortYear: YEAR,
        version: 2,
      });

      expect(full).toEqual({
        ok: false,
        error: "Semua kelompok sudah punya pengasuh.",
      });
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ version: 2 });
      expect(draft.log).toHaveLength(2);
    });
  });

  it("refuses a fill made from an older draft", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, FIRST_NIM, "UJIISI");
      await addTestMentor(db, { name: "Isi Adi" });

      const stale = await fillDraftMentors(db, actor, {
        cohortYear: YEAR,
        version: 0,
      });

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(await mentorNames(db)).toEqual([null, null, null]);
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor"])(
    "refuses %s, and fills nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addTestDraft(db, YEAR, FIRST_NIM, "UJIISI");
        await addTestMentor(db, { name: "Isi Adi" });
        const other = await addTestActor(db, [role], "Akun Uji Ditolak");

        expect(await fillDraftMentors(db, other, KEY)).toEqual(NOT_ALLOWED);
        expect(await mentorNames(db)).toEqual([null, null, null]);
      });
    },
  );
});
