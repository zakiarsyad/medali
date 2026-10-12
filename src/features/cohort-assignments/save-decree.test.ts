import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { chooseMentor } from "./choose-mentor";
import {
  ALREADY_FIXED,
  DRAFT_CHANGED,
  NO_DRAFT,
  NOT_ALLOWED,
} from "./refusals";
import { saveDecree, submitDraft } from "./save-decree";
import {
  addCompleteTestDraft,
  addTestDraft,
  fixTestDraft,
  testDraftOf,
  testGroupsOf,
} from "./test-drafts";
import { addTestActor, addTestStudents } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2051;
const DECREE = { decreeNumber: "KEP-51/UJI/2051", effectiveOn: "2051-09-01" };
/** A complete draft stands at version 2: formed, then its mentors filled. */
const INPUT = { cohortYear: YEAR, version: 2, ...DECREE };

describe("saveDecree", () => {
  it("saves the number and the day, and submits nothing", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, "UJISIMPAN");

      const saved = await saveDecree(db, actor, { ...INPUT, version: 1 });

      expect(saved).toEqual({ ok: true, value: null });
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ status: "draft", version: 2, ...DECREE });
      expect(draft.log.map((line) => line.action).sort()).toEqual([
        "draft_saved",
        "groups_formed",
      ]);
    });
  });

  it("takes the number and the day off again when they are sent empty", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, "UJISIMPAN");
      await saveDecree(db, actor, { ...INPUT, version: 1 });

      await saveDecree(db, actor, {
        ...INPUT,
        decreeNumber: null,
        effectiveOn: null,
      });

      expect(await testDraftOf(db, YEAR)).toMatchObject({
        decreeNumber: null,
        effectiveOn: null,
        version: 3,
      });
    });
  });

  it("keeps a submitted draft submitted, for Kepala Unit who changes it", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addCompleteTestDraft(db, YEAR, "UJISIMPAN");
      await submitDraft(db, actor, INPUT);
      const head = await addTestActor(db, ["head_of_unit"], "Kepala Simpan");

      const saved = await saveDecree(db, head, { ...INPUT, version: 3 });

      expect(saved.ok).toBe(true);
      expect(await testDraftOf(db, YEAR)).toMatchObject({
        status: "submitted",
        savedBy: "Kepala Simpan",
      });
    });
  });

  it("refuses a save made from an older draft, a fixed angkatan and one without groups", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, "UJISIMPAN");

      const stale = await saveDecree(db, actor, { ...INPUT, version: 0 });
      const unformed = await saveDecree(db, actor, {
        ...INPUT,
        cohortYear: YEAR + 20,
      });
      await fixTestDraft(db, YEAR);
      const fixed = await saveDecree(db, actor, { ...INPUT, version: 1 });

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(unformed).toEqual(NO_DRAFT);
      expect(fixed).toEqual(ALREADY_FIXED);
      expect((await testDraftOf(db, YEAR)).log).toHaveLength(1);
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor", "student"])(
    "refuses %s, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addTestDraft(db, YEAR, "UJISIMPAN");
        const other = await addTestActor(db, [role], "Akun Uji Ditolak");

        const saved = await saveDecree(db, other, { ...INPUT, version: 1 });

        expect(saved).toEqual(NOT_ALLOWED);
        expect(await testDraftOf(db, YEAR)).toMatchObject({
          version: 1,
          decreeNumber: null,
        });
      });
    },
  );
});

describe("submitDraft", () => {
  it.each<RoleId>(["upk_staff", "head_of_unit"])(
    "makes the draft Diajukan for %s, with the number, the day and a line in the log",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addCompleteTestDraft(db, YEAR, "UJIAJUKAN");
        const sender = await addTestActor(db, [role], "Pengaju Uji");

        const submitted = await submitDraft(db, sender, INPUT);

        expect(submitted).toEqual({ ok: true, value: null });
        const draft = await testDraftOf(db, YEAR);
        expect(draft).toMatchObject({
          status: "submitted",
          version: 3,
          savedBy: "Pengaju Uji",
          ...DECREE,
        });
        expect(draft.log.map((line) => [line.action, line.by])).toContainEqual([
          "submitted",
          "Pengaju Uji",
        ]);
      });
    },
  );

  it("submits without a decree number, which only the penetapan asks for", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addCompleteTestDraft(db, YEAR, "UJIAJUKAN");

      const submitted = await submitDraft(db, actor, {
        ...INPUT,
        decreeNumber: null,
      });

      expect(submitted.ok).toBe(true);
    });
  });

  it("refuses a draft with a group without a mentor, sent past the switched-off button", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addTestDraft(db, YEAR, "UJIAJUKAN");

      const submitted = await submitDraft(db, actor, { ...INPUT, version: 1 });

      expect(submitted).toEqual({
        ok: false,
        error:
          "Draf belum bisa diajukan atau ditetapkan. 3 kelompok belum punya pengasuh.",
      });
      expect(await testDraftOf(db, YEAR)).toMatchObject({
        status: "draft",
        version: 1,
        decreeNumber: null,
      });
    });
  });

  it("refuses a draft with one mentor chosen for two groups", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addCompleteTestDraft(db, YEAR, "UJIAJUKAN");
      const [first, second] = (await testDraftOf(db, YEAR)).groups;
      await chooseMentor(db, actor, {
        cohortYear: YEAR,
        version: 2,
        groupId: first?.id ?? "",
        mentorId: second?.mentor?.id ?? null,
      });

      const submitted = await submitDraft(db, actor, { ...INPUT, version: 3 });

      expect(submitted.ok).toBe(false);
      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({ status: "draft", version: 3 });
      expect(draft.log.map((line) => line.action)).not.toContain("submitted");
    });
  });

  it("refuses a draft that leaves out a waiting student of the angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { actor, large } = await addCompleteTestDraft(
        db,
        YEAR,
        "UJIAJUKAN",
      );
      await addTestStudents(db, large, 1, 9951000900, { cohortYear: YEAR });

      const submitted = await submitDraft(db, actor, INPUT);

      expect(submitted).toEqual({
        ok: false,
        error:
          'Draf belum bisa diajukan atau ditetapkan. 1 mahasiswa angkatan ini belum masuk kelompok mana pun pada draf. Tekan "Bentuk ulang" agar ikut dibagi ke kelompok.',
      });
      expect(await testDraftOf(db, YEAR)).toMatchObject({
        status: "draft",
        version: 2,
      });
    });
  });

  it("refuses a draft with a group without a member, and one with a member of another program studi", async () => {
    await inTestDatabase(async (db) => {
      const { actor, large, small } = await addCompleteTestDraft(
        db,
        YEAR,
        "UJIAJUKAN",
      );
      const [group] = await testGroupsOf(db, YEAR, large);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.studyProgramId, small));
      await db
        .update(students)
        .set({ studyProgramId: small })
        .where(eq(students.id, group?.members[0]?.id ?? ""));

      const submitted = await submitDraft(db, actor, INPUT);

      expect(submitted).toMatchObject({
        ok: false,
        error: expect.stringMatching(
          /1 kelompok tidak punya anggota\..*1 mahasiswa pada draf sudah berganti program studi atau jalur\./,
        ),
      });
      expect(await testDraftOf(db, YEAR)).toMatchObject({ status: "draft" });
    });
  });

  it("refuses a submit made from an older draft, and a fixed angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { actor } = await addCompleteTestDraft(db, YEAR, "UJIAJUKAN");

      const stale = await submitDraft(db, actor, { ...INPUT, version: 1 });
      await fixTestDraft(db, YEAR);
      const fixed = await submitDraft(db, actor, INPUT);

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(fixed).toEqual(ALREADY_FIXED);
    });
  });

  it.each<RoleId>(["director", "head_of_program", "mentor", "student"])(
    "refuses %s, and submits nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addCompleteTestDraft(db, YEAR, "UJIAJUKAN");
        const other = await addTestActor(db, [role], "Akun Uji Ditolak");

        expect(await submitDraft(db, other, INPUT)).toEqual(NOT_ALLOWED);
        expect(await testDraftOf(db, YEAR)).toMatchObject({
          status: "draft",
          version: 2,
        });
      });
    },
  );
});
