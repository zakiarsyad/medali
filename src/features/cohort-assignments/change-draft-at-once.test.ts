import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { chooseMentor } from "./choose-mentor";
import { formAssignment } from "./form-assignment";
import type { Forming } from "./forming-input";
import { DRAFT_CHANGED } from "./refusals";
import { addTestDraft, testDraftOf } from "./test-drafts";
import {
  addTestActor,
  addTestMentor,
  addTestProgram,
  addTestStudents,
} from "./test-records";

/*
 * The log of a penetapan cannot be emptied, so no rows are removed after
 * a check: each one uses an angkatan of its own, and the database is
 * dropped at the end.
 */
const own = withOwnTestDatabase("ubahdraf");

/** A draft at version 1, its first group and two mentors to choose from. */
async function addDraftAndMentors(db: Database, year: number, tag: string) {
  const { actor } = await addTestDraft(db, year, tag);
  const [group] = (await testDraftOf(db, year)).groups;
  if (!group) throw new Error("The draft has no group.");
  const first = await addTestMentor(db, { name: `Pengasuh ${tag} Satu` });
  const second = await addTestMentor(db, { name: `Pengasuh ${tag} Dua` });
  const other = await addTestActor(db, ["head_of_unit"], `Kepala ${tag}`);
  return { actor, other, groupId: group.id, first, second };
}

function actionsOf(db: Database, year: number): Promise<string[]> {
  return testDraftOf(db, year).then((draft) =>
    draft.log.map((line) => line.action),
  );
}

describe("two people who change one draft at the same moment", () => {
  it("saves the first choice of a mentor: the second waits and is told the draft changed", async () => {
    const year = 2057;
    const made = await addDraftAndMentors(own.db, year, "UJIBARENG");
    const choice = { cohortYear: year, version: 1, groupId: made.groupId };

    const both = await own.atOnce(
      (db) => chooseMentor(db, made.actor, { ...choice, mentorId: made.first }),
      (db) =>
        chooseMentor(db, made.other, { ...choice, mentorId: made.second }),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(DRAFT_CHANGED);
    const draft = await testDraftOf(own.db, year);
    expect(draft).toMatchObject({ version: 2, savedBy: "Pegawai UJIBARENG" });
    const saved = draft.groups.find((group) => group.id === made.groupId);
    expect(saved?.mentor).toMatchObject({ id: made.first });
    expect(await actionsOf(own.db, year)).toEqual([
      "draft_saved",
      "groups_formed",
    ]);
  });

  it("forms the groups again once: a choice sent at the same moment waits and is told the draft changed", async () => {
    const year = 2058;
    const made = await addDraftAndMentors(own.db, year, "UJIULANG");
    const forming: Forming = {
      cohortYear: year,
      targetSize: 25,
      method: "by_nim",
      version: 1,
    };

    const both = await own.atOnce<{ ok: boolean }>(
      (db) => formAssignment(db, made.actor, forming),
      (db) =>
        chooseMentor(db, made.other, {
          cohortYear: year,
          version: 1,
          groupId: made.groupId,
          mentorId: made.first,
        }),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(DRAFT_CHANGED);
    const draft = await testDraftOf(own.db, year);
    expect(draft).toMatchObject({ version: 2, targetSize: 25 });
    expect(draft.groups.map((group) => group.mentor)).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe("two people who form the groups of one angkatan at the same moment", () => {
  it("starts one draft: the second waits, is told the draft changed, and forms nothing", async () => {
    const year = 2059;
    const program = await addTestProgram(own.db, "UJIMULAI Pajak");
    await addTestStudents(own.db, program, 30, 9959000001, {
      cohortYear: year,
    });
    const staff = await addTestActor(own.db, ["upk_staff"], "Pegawai Mulai");
    const head = await addTestActor(own.db, ["head_of_unit"], "Kepala Mulai");
    const forming: Forming = {
      cohortYear: year,
      targetSize: 30,
      method: "by_nim",
      version: 0,
    };

    const both = await own.atOnce(
      (db) => formAssignment(db, staff, forming),
      (db) => formAssignment(db, head, forming),
    );

    expect(both.sooner).toEqual({ ok: true, value: 1 });
    expect(both.later).toEqual(DRAFT_CHANGED);
    const draft = await testDraftOf(own.db, year);
    expect(draft).toMatchObject({ version: 1, savedBy: "Pegawai Mulai" });
    expect(draft.groups).toHaveLength(1);
    expect(await actionsOf(own.db, year)).toEqual(["groups_formed"]);
  });
});
